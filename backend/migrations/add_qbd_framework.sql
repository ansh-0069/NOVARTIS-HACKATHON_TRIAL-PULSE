-- Create QbD framework tables

-- Critical Quality Attributes (CQAs)
CREATE TABLE IF NOT EXISTS cqas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  lower_limit REAL,
  upper_limit REAL,
  criticality TEXT CHECK(criticality IN ('HIGH', 'MEDIUM', 'LOW')),
  justification TEXT,
  measurement_method TEXT,
  acceptance_criteria TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default CQAs for mass balance
INSERT OR IGNORE INTO cqas (id, name, description, target_value, lower_limit, upper_limit, criticality, justification, measurement_method, acceptance_criteria) VALUES
('cqa_001', 'Mass Balance (CIMB)', 'Corrected mass balance accounting for RRF and stoichiometry', 100.0, 95.0, 105.0, 'HIGH', 'Critical for ensuring complete degradation pathway understanding and product stability', 'HPLC with multi-wavelength detection', 'CIMB within 95-105% indicates acceptable mass closure'),
('cqa_002', 'Degradation Level', 'Percentage of API degraded under stress conditions', NULL, 5.0, 25.0, 'MEDIUM', 'Demonstrates forced degradation effectiveness without excessive product loss', 'HPLC peak area comparison', 'Degradation between 5-25% provides meaningful stability information'),
('cqa_003', 'Unknown Degradants', 'Number of unidentified degradation products', 0, 0, 2, 'HIGH', 'Unknown degradants require identification and qualification per ICH Q3B', 'Peak counting in chromatogram', 'Maximum 2 unknown peaks above reporting threshold'),
('cqa_004', 'Confidence Index', 'Statistical confidence in mass balance calculation', 85.0, 70.0, 100.0, 'MEDIUM', 'Quantifies analytical uncertainty and data quality', 'Bayesian statistical model', 'CI > 70% indicates acceptable analytical precision');

-- Process Parameters (Critical Process Parameters - CPPs)
CREATE TABLE IF NOT EXISTS process_parameters (
  id TEXT PRIMARY KEY,
  parameter_name TEXT NOT NULL,
  description TEXT,
  normal_operating_range_min REAL,
  normal_operating_range_max REAL,
  proven_acceptable_range_min REAL,
  proven_acceptable_range_max REAL,
  unit TEXT,
  criticality TEXT CHECK(criticality IN ('HIGH', 'MEDIUM', 'LOW')),
  impact_on_cqa TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default process parameters
INSERT OR IGNORE INTO process_parameters (id, parameter_name, description, normal_operating_range_min, normal_operating_range_max, proven_acceptable_range_min, proven_acceptable_range_max, unit, criticality, impact_on_cqa) VALUES
('cpp_001', 'Stress Temperature', 'Temperature during forced degradation', 40.0, 60.0, 25.0, 80.0, '°C', 'HIGH', 'Directly affects degradation rate and product formation'),
('cpp_002', 'Stress Duration', 'Time under stress conditions', 24.0, 168.0, 1.0, 336.0, 'hours', 'MEDIUM', 'Longer duration increases degradation level'),
('cpp_003', 'pH (Acid/Base Stress)', 'Solution pH for hydrolytic stress', 2.0, 12.0, 1.0, 14.0, 'pH units', 'HIGH', 'pH drives hydrolysis mechanisms and product profiles'),
('cpp_004', 'H2O2 Concentration', 'Peroxide concentration for oxidative stress', 1.0, 5.0, 0.1, 10.0, '% w/v', 'MEDIUM', 'Controls oxidative degradation extent');

-- Design Space Experiments
CREATE TABLE IF NOT EXISTS design_space_experiments (
  id TEXT PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  experiment_type TEXT CHECK(experiment_type IN ('DOE', 'EDGE_OF_FAILURE', 'ROBUSTNESS', 'VALIDATION')),
  temperature REAL,
  duration REAL,
  ph REAL,
  oxidizer_conc REAL,
  stress_type TEXT,
  measured_cimb REAL,
  measured_degradation REAL,
  measured_unknowns INTEGER,
  measured_ci REAL,
  meets_cqa BOOLEAN,
  notes TEXT,
  performed_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Control Strategy
CREATE TABLE IF NOT EXISTS control_strategy (
  id TEXT PRIMARY KEY,
  control_type TEXT CHECK(control_type IN ('MATERIAL', 'PROCESS', 'IN_PROCESS', 'RELEASE')),
  parameter_controlled TEXT NOT NULL,
  control_method TEXT,
  acceptance_criteria TEXT,
  monitoring_frequency TEXT,
  escalation_procedure TEXT,
  responsible_role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO control_strategy VALUES
('cs_001', 'PROCESS', 'Stress Temperature', 'Calibrated water bath with continuous monitoring', '±2°C of target', 'Continuous', 'Stop test if deviation >3°C', 'QC Analyst', CURRENT_TIMESTAMP),
('cs_002', 'IN_PROCESS', 'Degradation Level', 'HPLC assay at time zero and end', '5-25% degradation', 'Each stress condition', 'Extend or reduce stress time', 'Analytical Chemist', CURRENT_TIMESTAMP),
('cs_003', 'RELEASE', 'Mass Balance (CIMB)', 'Full CIMB calculation with CI', '95-105%', 'Each sample', 'Investigate OOS if outside range', 'QC Manager', CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_design_exp_type ON design_space_experiments(experiment_type);
CREATE INDEX IF NOT EXISTS idx_cqa_criticality ON cqas(criticality);
