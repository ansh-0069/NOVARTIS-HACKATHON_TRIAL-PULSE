/**
 * Regulatory Compliance Matrix
 * Maps CIMB++ implementation to ICH/FDA requirements
 */

const REGULATORY_MAPPING = {
    'ICH_Q1A_R2': {
        code: 'ICH Q1A(R2)',
        title: 'Stability Testing of New Drug Substances and Products',
        requirements: [
            {
                id: 'Q1A-001',
                requirement: 'Mass balance closure: API assay + degradation products = 100% ± 5%',
                implementation: 'CIMB and LK-IMB calculations with stoichiometric corrections',
                method: 'calculateMassBalance()',
                validation_file: 'validation/mass_balance_closure.pdf',
                sop_reference: 'SOP-MB-001 v2.0',
                status: 'COMPLIANT',
                evidence: 'All five methods (SMB, AMB, RMB, LK-IMB, CIMB) calculate mass balance closure',
                test_case: 'test_cases/ich_q1a_001.json'
            },
            {
                id: 'Q1A-002',
                requirement: 'Forced degradation: acid, base, oxidative, photolytic, thermal conditions',
                implementation: 'Stress type selection with pathway-specific stoichiometric factors',
                method: 'stress_type parameter with S-factor calculation',
                validation_file: 'validation/stress_conditions.pdf',
                sop_reference: 'SOP-STRESS-001 v1.5',
                status: 'COMPLIANT',
                evidence: 'S-factor adapts: Acid/Base adds H2O (MW+18), Oxidative adds O (MW+16)',
                test_case: 'test_cases/ich_q1a_002.json'
            },
            {
                id: 'Q1A-003',
                requirement: 'Degradation products must be identified and quantified',
                implementation: 'Degradant measurement with MW and RRF corrections',
                method: 'degradant_mw, rrf, lambda, omega parameters',
                validation_file: 'validation/degradant_quantification.pdf',
                sop_reference: 'SOP-QUANT-002 v1.0',
                status: 'COMPLIANT',
                evidence: 'Individual degradant tracking with correction factors',
                test_case: 'test_cases/ich_q1a_003.json'
            }
        ]
    },

    'ICH_Q2_R2': {
        code: 'ICH Q2(R2)',
        title: 'Validation of Analytical Procedures',
        requirements: [
            {
                id: 'Q2-001',
                requirement: 'Accuracy: Recovery studies and mass balance verification',
                implementation: '95% confidence intervals for mass balance results',
                method: 'calculateConfidenceIntervals() with t-distribution (df=2)',
                validation_file: 'validation/accuracy_validation.pdf',
                sop_reference: 'SOP-VAL-001 v3.0',
                status: 'COMPLIANT',
                evidence: 'LK-IMB and CIMB report lower_ci, upper_ci using t-critical = 4.303',
                test_case: 'test_cases/ich_q2_001.json'
            },
            {
                id: 'Q2-002',
                requirement: 'Precision: Quantification of analytical variability',
                implementation: 'Uncertainty propagation through error analysis',
                method: 'Variance: api_variance + deg_variance × correction_factor²',
                validation_file: 'validation/precision_study.pdf',
                sop_reference: 'SOP-VAL-002 v2.5',
                status: 'COMPLIANT',
                evidence: 'Combined standard deviation calculated via error propagation',
                test_case: 'test_cases/ich_q2_002.json'
            },
            {
                id: 'Q2-003',
                requirement: 'Linearity and range for degradation products',
                implementation: 'RRF (Relative Response Factor) correction',
                method: 'lambda = 1/RRF applied to degradant quantification',
                validation_file: 'validation/linearity_study.pdf',
                sop_reference: 'SOP-VAL-003 v1.8',
                status: 'COMPLIANT',
                evidence: 'RRF parameter allows detector response normalization',
                test_case: 'test_cases/ich_q2_003.json'
            }
        ]
    },

    'ICH_Q3A_R2': {
        code: 'ICH Q3A(R2)',
        title: 'Impurities in New Drug Substances',
        requirements: [
            {
                id: 'Q3A-001',
                requirement: 'Report all impurities ≥ 0.05% (degradation products)',
                implementation: 'Degradant tracking with initial vs stressed comparison',
                method: 'initial_degradants, stressed_degradants parameters',
                validation_file: 'validation/impurity_reporting.pdf',
                sop_reference: 'SOP-IMP-001 v2.0',
                status: 'COMPLIANT',
                evidence: 'Delta degradants = stressed_degradants - initial_degradants',
                test_case: 'test_cases/ich_q3a_001.json'
            },
            {
                id: 'Q3A-002',
                requirement: 'Qualification threshold for degradation products',
                implementation: 'Risk-based classification: LOW/MODERATE/HIGH',
                method: 'Risk level based on MB result ranges',
                validation_file: 'validation/risk_classification.pdf',
                sop_reference: 'SOP-RISK-001 v1.5',
                status: 'COMPLIANT',
                evidence: 'LOW: 98-102%, MODERATE: 95-98%/102-105%, HIGH: <95%/>105%',
                test_case: 'test_cases/ich_q3a_002.json'
            }
        ]
    },

    'FDA_IND': {
        code: 'FDA IND',
        title: 'Investigational New Drug Application',
        requirements: [
            {
                id: 'FDA-001',
                requirement: 'Stability data with justified analytical procedures',
                implementation: 'Method recommendation based on degradation level',
                method: 'recommended_method selection algorithm',
                validation_file: 'validation/method_justification.pdf',
                sop_reference: 'SOP-METHOD-001 v2.0',
                status: 'COMPLIANT',
                evidence: 'Auto-selection: <2% → AMB, 5-20% → RMB, >20% → CIMB',
                test_case: 'test_cases/fda_ind_001.json'
            },
            {
                id: 'FDA-002',
                requirement: 'Statistical confidence in analytical results',
                implementation: 'Confidence index calculation',
                method: 'confidence_index based on degradation level',
                validation_file: 'validation/confidence_index.pdf',
                sop_reference: 'SOP-STAT-001 v1.8',
                status: 'COMPLIANT',
                evidence: '<5% deg: CI=70%, 5-10%: CI=85%, >10%: CI=95%',
                test_case: 'test_cases/fda_ind_002.json'
            },
            {
                id: 'FDA-003',
                requirement: 'Risk assessment and mitigation strategy',
                implementation: 'Diagnostic messages with investigation triggers',
                method: 'diagnostic_message, rationale generation',
                validation_file: 'validation/risk_mitigation.pdf',
                sop_reference: 'SOP-RISK-002 v2.2',
                status: 'COMPLIANT',
                evidence: 'Auto-generated investigation recommendations for OOS results',
                test_case: 'test_cases/fda_ind_003.json'
            }
        ]
    },

    'FDA_NDA': {
        code: 'FDA NDA/BLA',
        title: 'New Drug Application / Biologics License Application',
        requirements: [
            {
                id: 'NDA-001',
                requirement: 'Complete degradation profile with mass balance',
                implementation: 'Five complementary methods (SMB, AMB, RMB, LK-IMB, CIMB)',
                method: 'All methods calculated simultaneously',
                validation_file: 'validation/method_comparison.pdf',
                sop_reference: 'SOP-NDA-001 v3.0',
                status: 'COMPLIANT',
                evidence: 'Comprehensive method comparison in results table',
                test_case: 'test_cases/fda_nda_001.json'
            },
            {
                id: 'NDA-002',
                requirement: 'Validated analytical methods with documented performance',
                implementation: 'Correction factor documentation (λ, ω, S)',
                method: 'correction_factors object in results',
                validation_file: 'validation/correction_factors.pdf',
                sop_reference: 'SOP-NDA-002 v2.5',
                status: 'COMPLIANT',
                evidence: 'Lambda, Omega, Stoichiometric factors logged per calculation',
                test_case: 'test_cases/fda_nda_002.json'
            }
        ]
    },

    'EMA_ICH_M7': {
        code: 'EMA ICH M7',
        title: 'Assessment and Control of DNA Reactive Impurities',
        requirements: [
            {
                id: 'M7-001',
                requirement: 'Identification and control of mutagenic impurities',
                implementation: 'Degradant MW tracking for structural alerts',
                method: 'degradant_mw parameter enables MW-based screening',
                validation_file: 'validation/mutagenic_screening.pdf',
                sop_reference: 'SOP-MUT-001 v1.0',
                status: 'PARTIAL',
                evidence: 'MW tracking present; structural analysis requires upgrade #1',
                test_case: 'test_cases/ema_m7_001.json'
            }
        ]
    }
};

/**
 * Generate compliance report for a specific guideline
 */
function getComplianceReport(guidelineCode) {
    const guideline = REGULATORY_MAPPING[guidelineCode];

    if (!guideline) {
        return { error: 'Guideline not found', available: Object.keys(REGULATORY_MAPPING) };
    }

    const total = guideline.requirements.length;
    const compliant = guideline.requirements.filter(r => r.status === 'COMPLIANT').length;
    const partial = guideline.requirements.filter(r => r.status === 'PARTIAL').length;
    const nonCompliant = guideline.requirements.filter(r => r.status === 'NON-COMPLIANT').length;

    return {
        guideline: guideline.code,
        title: guideline.title,
        compliance_score: ((compliant + partial * 0.5) / total * 100).toFixed(1),
        summary: {
            total_requirements: total,
            compliant: compliant,
            partial: partial,
            non_compliant: nonCompliant
        },
        requirements: guideline.requirements
    };
}

/**
 * Generate full compliance matrix
 */
function getFullComplianceMatrix() {
    const matrix = {};

    Object.keys(REGULATORY_MAPPING).forEach(code => {
        matrix[code] = getComplianceReport(code);
    });

    const totalReqs = Object.values(REGULATORY_MAPPING).reduce((sum, g) => sum + g.requirements.length, 0);
    const compliantReqs = Object.values(REGULATORY_MAPPING).reduce((sum, g) =>
        sum + g.requirements.filter(r => r.status === 'COMPLIANT').length, 0);

    return {
        overall_compliance: ((compliantReqs / totalReqs) * 100).toFixed(1),
        guidelines: matrix,
        summary: {
            total_guidelines: Object.keys(REGULATORY_MAPPING).length,
            total_requirements: totalReqs,
            compliant_requirements: compliantReqs
        }
    };
}

/**
 * Get requirements for a specific calculation
 */
function getCalculationCompliance(calculationData) {
    const applicable = [];

    // Check which requirements apply based on calculation parameters
    if (calculationData.stressed_degradants > 0) {
        applicable.push(REGULATORY_MAPPING['ICH_Q1A_R2'].requirements[0]);
        applicable.push(REGULATORY_MAPPING['ICH_Q3A_R2'].requirements[0]);
    }

    if (calculationData.rrf && calculationData.rrf !== 1.0) {
        applicable.push(REGULATORY_MAPPING['ICH_Q2_R2'].requirements[2]);
    }

    if (calculationData.cimb_risk_level === 'HIGH') {
        applicable.push(REGULATORY_MAPPING['FDA_IND'].requirements[2]);
    }

    return {
        calculation_id: calculationData.calculation_id,
        applicable_requirements: applicable,
        compliance_status: applicable.every(r => r.status === 'COMPLIANT') ? 'PASS' : 'REVIEW'
    };
}

module.exports = {
    REGULATORY_MAPPING,
    getComplianceReport,
    getFullComplianceMatrix,
    getCalculationCompliance
};
