-- Add LIMS integration fields
ALTER TABLE calculations ADD COLUMN lims_submitted BOOLEAN DEFAULT 0;
ALTER TABLE calculations ADD COLUMN lims_id TEXT;
ALTER TABLE calculations ADD COLUMN lims_submission_date DATETIME;
ALTER TABLE calculations ADD COLUMN lims_system TEXT;

-- Create LIMS submissions log
CREATE TABLE IF NOT EXISTS lims_submissions (
  id TEXT PRIMARY KEY,
  calculation_id TEXT NOT NULL,
  lims_system TEXT NOT NULL,
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  lims_id TEXT,
  status TEXT,
  error_message TEXT,
  FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lims_calc_id ON lims_submissions(calculation_id);
