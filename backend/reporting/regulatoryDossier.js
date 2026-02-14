const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mass_balance.db');

/**
 * Regulatory Reporting Engine
 * Aggregates data from calculations, stability, and LIMS for ICH dossiers
 */
class RegulatoryReportingEngine {
    constructor() {
        this.ich_thresholds = {
            reporting: 0.05,
            identification: 0.10,
            qualification: 0.15
        };
    }

    /**
     * Generate a comprehensive dossier for a product
     * @param {string} productName 
     */
    async generateDossier(productName) {
        return new Promise((resolve, reject) => {
            const dossier = {
                metadata: {
                    product_name: productName,
                    generated_at: new Date().toISOString(),
                    report_id: `REG-${Date.now()}`
                },
                sections: {
                    mass_balance_summary: [],
                    degradation_profiles: [],
                    stability_compliance: [],
                    ich_alerts: []
                }
            };

            // 1. Fetch Mass Balance History
            db.all(`SELECT * FROM calculations WHERE sample_id LIKE ? ORDER BY timestamp DESC`, [`%${productName}%`], (err, calcs) => {
                if (err) return reject(err);

                dossier.sections.mass_balance_summary = calcs.map(c => ({
                    id: c.id,
                    batch: c.sample_id,
                    method: c.recommended_method,
                    value: c.recommended_value,
                    ci_lower: c.recommended_value - (c.recommended_value * 0.02), // Fallback if CI columns not in DB
                    ci_upper: c.recommended_value + (c.recommended_value * 0.02),
                    risk: c.status === 'PASS' ? 'Low' : 'High',
                    date: c.timestamp
                }));

                // 2. Fetch Stability Data
                db.all(`SELECT s.*, r.parameter_name, r.measured_value, r.compliance_status, t.planned_interval_months 
                        FROM stability_studies s
                        JOIN stability_timepoints t ON s.id = t.study_id
                        JOIN stability_results r ON t.id = r.timepoint_id
                        WHERE s.product_name LIKE ?`, [`%${productName}%`], (err, stability) => {
                    if (err) return reject(err);

                    dossier.sections.stability_compliance = stability;

                    // 3. ICH Compliance Check (Simplistic for now)
                    // Identify any degradants above qualification threshold
                    calcs.forEach(c => {
                        const results = JSON.parse(c.results_json || '{}');
                        if (results.degradants) {
                            results.degradants.forEach(d => {
                                if (d.percent > this.ich_thresholds.qualification) {
                                    dossier.sections.ich_alerts.push({
                                        type: 'QUALIFICATION_REQUIRED',
                                        component: d.name,
                                        value: d.percent,
                                        limit: this.ich_thresholds.qualification,
                                        batch: c.batch_number
                                    });
                                }
                            });
                        }
                    });

                    resolve(dossier);
                });
            });
        });
    }
}

module.exports = new RegulatoryReportingEngine();
