const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Excel Generator Module
const excelGenerator = require('./excelGenerator');

// Database setup
const db = new sqlite3.Database('./mass_balance.db', (err) => {
    if (err) {
        console.error('❌ Database error:', err);
    } else {
        console.log('✓ Connected to SQLite database');
    }
});

// Create tables with CIMB and LK-IMB statistical fields
db.run(`
  CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    sample_id TEXT,
    analyst_name TEXT,
    stress_type TEXT,
    initial_api REAL,
    stressed_api REAL,
    initial_degradants REAL,
    stressed_degradants REAL,
    degradant_mw REAL,
    parent_mw REAL,
    rrf REAL,
    smb REAL,
    amb REAL,
    rmb REAL,
    lk_imb REAL,
    lk_imb_lower_ci REAL,
    lk_imb_upper_ci REAL,
    lk_imb_risk_level TEXT,
    cimb REAL,
    cimb_lower_ci REAL,
    cimb_upper_ci REAL,
    cimb_risk_level TEXT,
    lambda REAL,
    omega REAL,
    stoichiometric_factor REAL,
    recommended_method TEXT,
    recommended_value REAL,
    confidence_index REAL,
    degradation_level REAL,
    status TEXT,
    diagnostic_message TEXT,
    rationale TEXT
  )
`, (err) => {
    if (err) {
        console.error('❌ Error creating table:', err);
    } else {
        console.log('✓ Database table ready');
    }
});

// Statistical helper functions for CIMB
function calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function getTDistributionValue(degreesOfFreedom, alpha = 0.05) {
    // Simplified t-distribution critical values for 95% CI (two-tailed)
    const tTable = {
        1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
        6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
        15: 2.131, 20: 2.086, 30: 2.042, 60: 2.000, 120: 1.980
    };

    if (degreesOfFreedom in tTable) {
        return tTable[degreesOfFreedom];
    } else if (degreesOfFreedom > 120) {
        return 1.96; // Z-value for large samples
    } else {
        // Interpolate
        const keys = Object.keys(tTable).map(Number).sort((a, b) => a - b);
        for (let i = 0; i < keys.length - 1; i++) {
            if (degreesOfFreedom >= keys[i] && degreesOfFreedom <= keys[i + 1]) {
                return tTable[keys[i]]; // Conservative estimate
            }
        }
        return 2.0; // Default conservative value
    }
}

// Calculation Engine
function calculateMassBalance(data) {
    const {
        initial_api,
        stressed_api,
        initial_degradants,
        stressed_degradants,
        degradant_mw,
        parent_mw,
        rrf,
        stress_type = 'Unknown'
    } = data;

    // Basic calculations
    const delta_api = initial_api - stressed_api;
    const delta_degradants = stressed_degradants - initial_degradants;
    const degradation_level = (delta_api / initial_api) * 100;

    // SMB - Simple Mass Balance
    const smb = stressed_api + stressed_degradants;

    // AMB - Absolute Mass Balance
    const amb = ((stressed_api + stressed_degradants) / (initial_api + initial_degradants)) * 100;

    // RMB - Relative Mass Balance
    const rmb = delta_api === 0 ? null : (delta_degradants / delta_api) * 100;

    // Correction factors
    const lambda = rrf ? 1 / rrf : 1.0;
    const omega = (degradant_mw && parent_mw) ? parent_mw / degradant_mw : 1.0;

    // Stoichiometric pathway factor based on stress type
    let stoichiometric_factor = 1.0;
    if (degradant_mw && parent_mw) {
        switch (stress_type.toLowerCase()) {
            case 'acid':
            case 'base':
                // Hydrolysis: typically adds H2O (18 g/mol)
                stoichiometric_factor = (parent_mw + 18) / degradant_mw;
                break;
            case 'oxidative':
                // Oxidation: typically adds O (16 g/mol)
                stoichiometric_factor = (parent_mw + 16) / degradant_mw;
                break;
            case 'photolytic':
            case 'thermal':
                // Fragmentation: use omega as is
                stoichiometric_factor = omega;
                break;
            default:
                stoichiometric_factor = omega;
        }
    }

    // LK-IMB - Lukulay-Körner Integrated Mass Balance with Confidence Intervals
    const corrected_degradants_lk = stressed_degradants * lambda * omega;
    const lk_imb_point = ((stressed_api + corrected_degradants_lk) / initial_api) * 100;

    // Calculate uncertainty and confidence intervals for LK-IMB
    // Assuming typical analytical uncertainty of ±2.5% for HPLC methods
    const analytical_uncertainty = 2.5; // % RSD

    // Propagate uncertainty through the calculation for LK-IMB
    const api_variance = Math.pow(stressed_api * analytical_uncertainty / 100, 2);
    const deg_variance = Math.pow(stressed_degradants * analytical_uncertainty / 100, 2);
    const lk_combined_variance = api_variance + deg_variance * Math.pow(lambda * omega, 2);
    const lk_combined_std = Math.sqrt(lk_combined_variance) / initial_api * 100;

    // 95% confidence interval using t-distribution (n=3 replicates typical)
    const df = 2; // degrees of freedom (n-1 for n=3)
    const t_critical = getTDistributionValue(df);
    const lk_margin_of_error = t_critical * lk_combined_std;

    const lk_imb_lower_ci = lk_imb_point - lk_margin_of_error;
    const lk_imb_upper_ci = lk_imb_point + lk_margin_of_error;

    // Risk-based threshold assessment for LK-IMB
    let lk_imb_risk_level;
    if (lk_imb_point >= 98 && lk_imb_point <= 102) {
        lk_imb_risk_level = 'LOW';
    } else if ((lk_imb_point >= 95 && lk_imb_point < 98) || (lk_imb_point > 102 && lk_imb_point <= 105)) {
        lk_imb_risk_level = 'MODERATE';
    } else {
        lk_imb_risk_level = 'HIGH';
    }

    // CIMB - Corrected Integrated Mass Balance with Confidence Intervals
    const corrected_degradants_cimb = stressed_degradants * lambda * stoichiometric_factor;
    const cimb_point = ((stressed_api + corrected_degradants_cimb) / initial_api) * 100;

    // Propagate uncertainty through the calculation for CIMB
    const cimb_combined_variance = api_variance + deg_variance * Math.pow(lambda * stoichiometric_factor, 2);
    const cimb_combined_std = Math.sqrt(cimb_combined_variance) / initial_api * 100;

    const cimb_margin_of_error = t_critical * cimb_combined_std;

    const cimb_lower_ci = cimb_point - cimb_margin_of_error;
    const cimb_upper_ci = cimb_point + cimb_margin_of_error;

    // Risk-based threshold assessment for CIMB
    let cimb_risk_level;
    if (cimb_point >= 98 && cimb_point <= 102) {
        cimb_risk_level = 'LOW';
    } else if ((cimb_point >= 95 && cimb_point < 98) || (cimb_point > 102 && cimb_point <= 105)) {
        cimb_risk_level = 'MODERATE';
    } else {
        cimb_risk_level = 'HIGH';
    }

    // Determine recommended method
    let recommended_method;
    if (delta_api < 2) {
        recommended_method = 'AMB';
    } else if (delta_api >= 5 && delta_api <= 20) {
        recommended_method = 'RMB';
    } else if (degradation_level > 20 || cimb_risk_level === 'HIGH') {
        recommended_method = 'CIMB'; // Use CIMB for high degradation or high risk
    } else {
        recommended_method = 'LK-IMB';
    }

    // Get recommended value
    const recommended_value =
        recommended_method === 'AMB' ? amb :
            recommended_method === 'RMB' ? rmb :
                recommended_method === 'LK-IMB' ? lk_imb_point :
                    recommended_method === 'CIMB' ? cimb_point :
                        smb;

    // Calculate confidence index based on degradation level
    let confidence_index;
    if (degradation_level < 5) {
        confidence_index = 70;
    } else if (degradation_level < 10) {
        confidence_index = 85;
    } else {
        confidence_index = 95;
    }

    // Determine status
    let status;
    if (recommended_value >= 98 && recommended_value <= 102) {
        status = 'PASS';
    } else if (recommended_value >= 95 && recommended_value <= 105) {
        status = 'ALERT';
    } else {
        status = 'OOS';
    }

    // Diagnostic message
    let diagnostic_message;
    if (recommended_value < 95) {
        diagnostic_message = 'Mass balance is below acceptable limits. Investigate for undetected degradation products or analytical method deficiencies.';
    } else if (recommended_value > 105) {
        diagnostic_message = 'Mass balance exceeds 105%. Check for analytical interference, impurity peaks being misidentified as API, or calibration issues.';
    } else if (recommended_value >= 95 && recommended_value < 98) {
        diagnostic_message = 'Mass balance is at lower borderline. Monitor closely and consider method validation.';
    } else if (recommended_value > 102 && recommended_value <= 105) {
        diagnostic_message = 'Mass balance is at upper borderline. Verify peak purity and check for co-elution.';
    } else {
        diagnostic_message = 'Mass balance is within acceptable limits (98-102%). Method demonstrates good recovery.';
    }

    // Rationale
    const rationale = `The ${recommended_method} method was selected based on ${degradation_level.toFixed(1)}% degradation level. This method accounts for ${recommended_method === 'CIMB' ? 'detector response (RRF), molecular weight changes, and degradation pathway stoichiometry' : recommended_method === 'LK-IMB' ? 'detector response (RRF) and molecular weight changes' : 'the specific characteristics of this degradation study'}.`;

    return {
        calculation_id: uuidv4(),
        timestamp: new Date().toISOString(),
        results: {
            smb: parseFloat(smb.toFixed(2)),
            amb: parseFloat(amb.toFixed(2)),
            rmb: rmb !== null ? parseFloat(rmb.toFixed(2)) : null,
            lk_imb: parseFloat(lk_imb_point.toFixed(2)),
            lk_imb_lower_ci: parseFloat(lk_imb_lower_ci.toFixed(2)),
            lk_imb_upper_ci: parseFloat(lk_imb_upper_ci.toFixed(2)),
            lk_imb_risk_level,
            cimb: parseFloat(cimb_point.toFixed(2)),
            cimb_lower_ci: parseFloat(cimb_lower_ci.toFixed(2)),
            cimb_upper_ci: parseFloat(cimb_upper_ci.toFixed(2)),
            cimb_risk_level
        },
        correction_factors: {
            lambda: parseFloat(lambda.toFixed(2)),
            omega: parseFloat(omega.toFixed(2)),
            stoichiometric_factor: parseFloat(stoichiometric_factor.toFixed(2))
        },
        recommended_method,
        recommended_value: parseFloat(recommended_value.toFixed(2)),
        confidence_index: parseFloat(confidence_index.toFixed(1)),
        degradation_level: parseFloat(degradation_level.toFixed(1)),
        status,
        diagnostic_message,
        rationale
    };
}

// ============================================
// API Endpoints
// ============================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Mass Balance Calculator API - Enhanced with CIMB & Excel Reports',
        version: '2.1.0',
        methods: ['SMB', 'AMB', 'RMB', 'LK-IMB', 'CIMB'],
        features: ['Statistical Validation', 'Excel Report Generation']
    });
});

// POST /api/calculate
app.post('/api/calculate', (req, res) => {
    try {
        console.log('📊 Calculating mass balance with CIMB...');
        const calculation = calculateMassBalance(req.body);
        console.log('✓ Calculation complete:', calculation.recommended_method, calculation.recommended_value + '%');
        console.log('  CIMB:', calculation.results.cimb + '%', 'Risk:', calculation.results.cimb_risk_level);
        res.json(calculation);
    } catch (error) {
        console.error('❌ Calculation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/save
app.post('/api/save', (req, res) => {
    const { inputs, results } = req.body;

    const stmt = db.prepare(`
    INSERT INTO calculations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        results.calculation_id,
        results.timestamp,
        inputs.sample_id || '',
        inputs.analyst_name || '',
        inputs.stress_type || '',
        inputs.initial_api,
        inputs.stressed_api,
        inputs.initial_degradants,
        inputs.stressed_degradants,
        inputs.degradant_mw || null,
        inputs.parent_mw || null,
        inputs.rrf || null,
        results.results.smb,
        results.results.amb,
        results.results.rmb,
        results.results.lk_imb,
        results.results.lk_imb_lower_ci,
        results.results.lk_imb_upper_ci,
        results.results.lk_imb_risk_level,
        results.results.cimb,
        results.results.cimb_lower_ci,
        results.results.cimb_upper_ci,
        results.results.cimb_risk_level,
        results.correction_factors.lambda,
        results.correction_factors.omega,
        results.correction_factors.stoichiometric_factor,
        results.recommended_method,
        results.recommended_value,
        results.confidence_index,
        results.degradation_level,
        results.status,
        results.diagnostic_message,
        results.rationale,
        (err) => {
            if (err) {
                console.error('❌ Save error:', err);
                res.status(500).json({ error: err.message });
            } else {
                console.log('✓ Calculation saved:', results.calculation_id);
                res.json({ success: true, calculation_id: results.calculation_id });
            }
        }
    );

    stmt.finalize();
});

// GET /api/history
app.get('/api/history', (req, res) => {
    const { page = 1, limit = 20, analyst, stress_type } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM calculations WHERE 1=1';
    const params = [];

    if (analyst) {
        query += ' AND analyst_name LIKE ?';
        params.push(`%${analyst}%`);
    }

    if (stress_type) {
        query += ' AND stress_type = ?';
        params.push(stress_type);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ History fetch error:', err);
            res.status(500).json({ error: err.message });
        } else {
            db.get('SELECT COUNT(*) as total FROM calculations', (err, count) => {
                if (err) {
                    console.error('❌ Count error:', err);
                    res.status(500).json({ error: err.message });
                } else {
                    console.log('✓ History retrieved:', rows.length, 'records');
                    res.json({
                        total: count.total,
                        page: parseInt(page),
                        calculations: rows
                    });
                }
            });
        }
    });
});

// GET /api/calculation/:id
app.get('/api/calculation/:id', (req, res) => {
    db.get('SELECT * FROM calculations WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.error('❌ Fetch error:', err);
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Calculation not found' });
        } else {
            console.log('✓ Calculation retrieved:', req.params.id);
            res.json(row);
        }
    });
});

// DELETE /api/calculation/:id
app.delete('/api/calculation/:id', (req, res) => {
    db.run('DELETE FROM calculations WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            console.error('❌ Delete error:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('✓ Calculation deleted:', req.params.id);
            res.json({ success: true, deleted: this.changes });
        }
    });
});

// ============================================
// EXCEL REPORT GENERATION ENDPOINTS
// ============================================

// GET /api/excel/template
// Download a blank Excel template
app.get('/api/excel/template', async (req, res) => {
    try {
        console.log('📥 Generating Excel template...');
        const result = await excelGenerator.generateExcelReport({
            outputPath: 'Mass_Balance_Template.xlsx'
        });

        console.log('✓ Template generated:', result.filePath);
        res.download(result.filePath, 'Mass_Balance_Template.xlsx', (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download template' });
                }
            }
        });
    } catch (error) {
        console.error('❌ Template generation error:', error);
        res.status(500).json({
            error: 'Failed to generate template',
            details: error.message
        });
    }
});

// POST /api/excel/generate
// Generate Excel report from provided calculation data
app.post('/api/excel/generate', async (req, res) => {
    try {
        console.log('📊 Generating Excel report from data...');
        const data = req.body;
        const filename = `${data.sample_id || 'Report'}_${Date.now()}.xlsx`;

        const result = await excelGenerator.generateExcelReport({
            data,
            outputPath: filename
        });

        console.log('✓ Excel report generated:', result.filePath);
        res.download(result.filePath, filename, (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download report' });
                }
            }
        });
    } catch (error) {
        console.error('❌ Report generation error details:', JSON.stringify(error, null, 2));
        res.status(500).json({
            error: 'Failed to generate report',
            details: error.error || error.message
        });
    }
});

// GET /api/excel/calculation/:id
// Generate Excel report for a specific saved calculation
app.get('/api/excel/calculation/:id', async (req, res) => {
    try {
        console.log('📊 Generating Excel report for calculation:', req.params.id);

        const result = await excelGenerator.generateReportFromCalculation(db, req.params.id);

        console.log('✓ Report generated:', result.filePath);
        res.download(result.filePath, path.basename(result.filePath), (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download report' });
                }
            }
        });
    } catch (error) {
        console.error('❌ Report generation error:', error);
        res.status(500).json({
            error: 'Failed to generate report',
            details: error.message
        });
    }
});

// GET /api/excel/history
// Generate Excel report with calculation history
app.get('/api/excel/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        console.log(`📊 Generating history report (${limit} records)...`);

        const result = await excelGenerator.generateHistoryReport(db, limit);

        console.log('✓ History report generated:', result.filePath);
        res.download(result.filePath, 'Calculation_History.xlsx', (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download history report' });
                }
            }
        });
    } catch (error) {
        console.error('❌ History report error details:', JSON.stringify(error, null, 2));
        res.status(500).json({
            error: 'Failed to generate history report',
            details: error.error || error.message
        });
    }
});

// GET /api/excel/database
// Generate complete database report with all calculations
app.get('/api/excel/database', async (req, res) => {
    try {
        console.log('📊 Generating complete database report...');

        const result = await excelGenerator.generateExcelReport({
            dbPath: './mass_balance.db',
            outputPath: `Database_Report_${Date.now()}.xlsx`
        });

        console.log('✓ Database report generated:', result.filePath);
        res.download(result.filePath, 'Database_Report.xlsx', (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download database report' });
                }
            }
        });
    } catch (error) {
        console.error('❌ Database report error:', error);
        res.status(500).json({
            error: 'Failed to generate database report',
            details: error.message
        });
    }
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('   ✓ Backend server running successfully!');
    console.log('   ✓ Enhanced with CIMB Method + Excel Reports');
    console.log('   ✓ URL: http://localhost:' + PORT);
    console.log('   ✓ Database: SQLite (mass_balance.db)');
    console.log('   ✓ Status: Ready to receive requests');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Available Methods:');
    console.log('  • SMB    - Simple Mass Balance');
    console.log('  • AMB    - Absolute Mass Balance');
    console.log('  • RMB    - Relative Mass Balance');
    console.log('  • LK-IMB - Lukulay-Körner Integrated Mass Balance');
    console.log('  • CIMB   - Corrected Integrated Mass Balance');
    console.log('');
    console.log('API Endpoints:');
    console.log('  GET  /                          - Health check');
    console.log('  POST /api/calculate             - Calculate mass balance');
    console.log('  POST /api/save                  - Save calculation');
    console.log('  GET  /api/history               - Get calculation history');
    console.log('  GET  /api/calculation/:id       - Get specific calculation');
    console.log('  DELETE /api/calculation/:id     - Delete calculation');
    console.log('');
    console.log('Excel Report Endpoints:');
    console.log('  GET  /api/excel/template        - Download blank template');
    console.log('  POST /api/excel/generate        - Generate report from data');
    console.log('  GET  /api/excel/calculation/:id - Report for calculation');
    console.log('  GET  /api/excel/history         - History report (limit param)');
    console.log('  GET  /api/excel/database        - Full database report');
    console.log('');
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
