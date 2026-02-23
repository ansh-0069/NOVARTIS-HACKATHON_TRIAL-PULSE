-- Create table for storing Bayesian priors
CREATE TABLE IF NOT EXISTS method_priors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method_name TEXT NOT NULL,
    sample_type TEXT DEFAULT 'General',
    prior_mean REAL NOT NULL,
    prior_std REAL NOT NULL,
    n_samples INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(method_name, sample_type)
);

-- Initialize default priors for standard methods
INSERT OR IGNORE INTO method_priors (method_name, prior_mean, prior_std, n_samples) VALUES 
('SMB', 100.0, 5.0, 1),
('AMB', 100.0, 5.0, 1),
('RMB', 100.0, 10.0, 1),
('LK-IMB', 100.0, 2.5, 1),
('CIMB', 100.0, 2.0, 1);
