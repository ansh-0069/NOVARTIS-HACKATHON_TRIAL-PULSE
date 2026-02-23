-- Add hybrid detection columns to calculations table
ALTER TABLE calculations ADD COLUMN detection_method TEXT DEFAULT 'UV';
ALTER TABLE calculations ADD COLUMN uv_rrf REAL;
ALTER TABLE calculations ADD COLUMN elsd_rrf REAL;
ALTER TABLE calculations ADD COLUMN ms_intensity REAL;
ALTER TABLE calculations ADD COLUMN gc_ms_detected BOOLEAN DEFAULT 0;
ALTER TABLE calculations ADD COLUMN volatile_loss_pct REAL DEFAULT 0;
ALTER TABLE calculations ADD COLUMN uv_silent_degradants_pct REAL DEFAULT 0;
ALTER TABLE calculations ADD COLUMN composite_rrf REAL;
ALTER TABLE calculations ADD COLUMN detection_coverage_pct REAL DEFAULT 100;

-- Create degradant_profiles table for multi-peak tracking
CREATE TABLE IF NOT EXISTS degradant_profiles (
  id TEXT PRIMARY KEY,
  calculation_id TEXT NOT NULL,
  degradant_number INTEGER NOT NULL,
  degradant_name TEXT,
  retention_time REAL,
  uv_area REAL,
  elsd_area REAL,
  ms_mz REAL,
  molecular_formula TEXT,
  degradant_mw REAL,
  rrf_uv REAL DEFAULT 1.0,
  rrf_elsd REAL DEFAULT 1.0,
  corrected_amount_pct REAL,
  detection_source TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_degradant_calc_id ON degradant_profiles(calculation_id);
