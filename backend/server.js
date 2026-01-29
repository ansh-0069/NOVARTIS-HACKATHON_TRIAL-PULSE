const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./mass_balance.db', (err) => {
    if (err) {
        console.error('❌ Database error:', err);
    } else {
        console.log('✓ Connected to SQLite database');
    }
});

// Create tables
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
    lambda REAL,
    omega REAL,
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

// Calculation Engine
function calculateMassBalance(data) {
    const {
        initial_api,
        stressed_api,
        initial_degradants,
        stressed_degradants,
        degradant_mw,
        parent_mw,
        rrf
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
    const corrected_degradants = stressed_degradants * lambda * omega;

    // LK-IMB - Corrected Mass Balance
    const lk_imb = ((stressed_api + corrected_degradants) / initial_api) * 100;

    // Determine recommended method
    let recommended_method;
    if (delta_api < 2) {
        recommended_method = 'AMB';
    } else if (delta_api >= 5 && delta_api <= 20) {
        recommended_method = 'RMB';
    } else {
        recommended_method = 'LK-IMB';
    }

    // Get recommended value
    const recommended_value =
        recommended_method === 'AMB' ? amb :
            recommended_method === 'RMB' ? rmb :
                lk_imb;

    // Calculate confidence index
    const analytical_uncertainty = 2.5;
    const confidence_index = Math.abs(100 - amb) > 0
        ? 100 * (1 - analytical_uncertainty / Math.abs(100 - amb))
        : 95;

    // Determine status
    let status;
    if (recommended_value >= 95 && recommended_value <= 105) {
        status = 'PASS';
    } else if (recommended_value >= 90) {
        status = 'ALERT';
    } else {
        status = 'OOS';
    }

    // Generate diagnostic message
    let diagnostic_message;
    let rationale;

    if (amb < 95 && lambda === 1.0 && omega === 1.0) {
        diagnostic_message = '⚠ Suspected volatile loss detected. Recommend headspace GC-MS analysis.';
        rationale = 'Low mass balance with no correction factors suggests volatile degradation products.';
    } else if (amb < 95 && lambda > 1.2) {
        diagnostic_message = '⚠ UV-silent degradant suspected. Consider CAD or CLND detection.';
        rationale = 'High RRF correction suggests chromophore changes in degradation pathway.';
    } else if (delta_api < 2) {
        diagnostic_message = '✓ Low degradation level. AMB method appropriate.';
        rationale = 'Minimal degradation observed. Standard absolute method is sufficient.';
    } else if (degradation_level > 20) {
        diagnostic_message = '✓ Mass balance acceptable. Stoichiometric corrections applied.';
        rationale = 'High degradation with fragmentation detected. LK-IMB correction mandatory per best practices.';
    } else {
        diagnostic_message = '✓ Mass balance acceptable. Continue routine testing per ICH Q1A(R2).';
        rationale = 'Results within acceptable limits. No anomalies detected.';
    }

    return {
        calculation_id: uuidv4(),
        timestamp: new Date().toISOString(),
        results: {
            smb: parseFloat(smb.toFixed(2)),
            amb: parseFloat(amb.toFixed(2)),
            rmb: rmb !== null ? parseFloat(rmb.toFixed(2)) : null,
            lk_imb: parseFloat(lk_imb.toFixed(2))
        },
        correction_factors: {
            lambda: parseFloat(lambda.toFixed(2)),
            omega: parseFloat(omega.toFixed(2))
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

// API Endpoints

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Mass Balance Calculator API',
        version: '1.0.0'
    });
});

// POST /api/calculate
app.post('/api/calculate', (req, res) => {
    try {
        console.log('📊 Calculating mass balance...');
        const calculation = calculateMassBalance(req.body);
        console.log('✓ Calculation complete:', calculation.recommended_method, calculation.recommended_value + '%');
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
    INSERT INTO calculations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        results.correction_factors.lambda,
        results.correction_factors.omega,
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

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('   ✓ Backend server running successfully!');
    console.log('   ✓ URL: http://localhost:' + PORT);
    console.log('   ✓ Database: SQLite (mass_balance.db)');
    console.log('   ✓ Status: Ready to receive requests');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  / - Health check');
    console.log('  POST /api/calculate - Calculate mass balance');
    console.log('  POST /api/save - Save calculation');
    console.log('  GET  /api/history - Get calculation history');
    console.log('  GET  /api/calculation/:id - Get specific calculation');
    console.log('  DELETE /api/calculation/:id - Delete calculation');
    console.log('');
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});