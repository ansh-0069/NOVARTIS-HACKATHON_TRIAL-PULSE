const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mass_balance.db');
const { v4: uuidv4 } = require('uuid');

const studyId = uuidv4();
const startDate = new Date('2025-01-01').toISOString();

async function seed() {
    console.log('🌱 Seeding mock stability data...');

    // 1. Create Study
    await new Promise((resolve) => {
        db.run(`INSERT INTO stability_studies (id, product_name, batch_number, storage_conditions, start_date, notes)
                VALUES (?, ?, ?, ?, ?, ?)`,
            [studyId, 'Aspirin Tablets 100mg', 'B2025-X01', '25C/60RH', startDate, 'Mock verification study'], resolve);
    });

    // 2. Create Timepoints and Results
    // T=0, 3, 6, 12
    const timepoints = [
        { m: 0, assay: 100.2, imp: 0.05 },
        { m: 3, assay: 99.5, imp: 0.08 },
        { m: 6, assay: 98.8, imp: 0.12 },
        { m: 12, assay: 97.4, imp: 0.25 }
    ];

    for (const tp of timepoints) {
        const tpId = uuidv4();
        const pDate = new Date('2025-01-01');
        pDate.setMonth(pDate.getMonth() + tp.m);

        await new Promise((resolve) => {
            db.run(`INSERT INTO stability_timepoints (id, study_id, planned_interval_months, planned_date, actual_date, status)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                [tpId, studyId, tp.m, pDate.toISOString(), pDate.toISOString(), 'COMPLETED'], resolve);
        });

        // Add Assay Result
        await new Promise((resolve) => {
            db.run(`INSERT INTO stability_results (id, timepoint_id, parameter_name, measured_value, unit, limit_min, limit_max, compliance_status, performed_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), tpId, 'Assay', tp.assay, '%', 95, 105, 'PASS', pDate.toISOString()], resolve);
        });

        // Add Impurities Result
        await new Promise((resolve) => {
            db.run(`INSERT INTO stability_results (id, timepoint_id, parameter_name, measured_value, unit, limit_min, limit_max, compliance_status, performed_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), tpId, 'Total Impurities', tp.imp, '%', 0, 0.5, 'PASS', pDate.toISOString()], resolve);
        });
    }

    console.log('✅ Seeding complete!');
    db.close();
}

seed();
