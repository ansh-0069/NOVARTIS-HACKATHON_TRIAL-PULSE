-- Stability Monitoring Tables
-- ==========================

-- 1. Stability Studies
CREATE TABLE IF NOT EXISTS stability_studies (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    storage_conditions TEXT NOT NULL, -- e.g., "25C/60RH", "40C/75RH"
    start_date TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, SUSPENDED
    notes TEXT
);

-- 2. Stability Timepoints
CREATE TABLE IF NOT EXISTS stability_timepoints (
    id TEXT PRIMARY KEY,
    study_id TEXT NOT NULL,
    planned_interval_months INTEGER NOT NULL, -- 0, 3, 6, 9, 12, 18, 24, 36
    planned_date TEXT NOT NULL,
    actual_date TEXT,
    status TEXT DEFAULT 'PLANNED', -- PLANNED, COMPLETED, OVERDUE
    FOREIGN KEY (study_id) REFERENCES stability_studies(id)
);

-- 3. Stability Results
CREATE TABLE IF NOT EXISTS stability_results (
    id TEXT PRIMARY KEY,
    timepoint_id TEXT NOT NULL,
    parameter_name TEXT NOT NULL, -- Assay, Total Impurities, Known-1, etc.
    measured_value REAL,
    unit TEXT,
    limit_min REAL,
    limit_max REAL,
    compliance_status TEXT, -- PASS, FAIL, ALERT
    analyst TEXT,
    performed_date TEXT,
    notes TEXT,
    FOREIGN KEY (timepoint_id) REFERENCES stability_timepoints(id)
);
