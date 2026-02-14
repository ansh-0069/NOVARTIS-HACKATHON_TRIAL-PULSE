/**
 * Stability Prediction Service
 * Uses linear regression to estimate degradation rates and shelf life
 */
class StabilityPredictionService {
    /**
     * Predict shelf life (t90 - time to reach 90% assay or 10% degradation)
     * @param {Array} data - [{months, assay}]
     */
    predictShelfLife(data) {
        if (data.length < 2) return null;

        // Perform Linear Regression (y = mx + b)
        // x = months, y = assay
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        data.forEach(p => {
            sumX += p.months;
            sumY += p.assay;
            sumXY += p.months * p.assay;
            sumX2 += p.months * p.months;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // t90 calculation: 90 = slope * t + intercept => t = (90 - intercept) / slope
        // Only if it's degrading (slope < 0)
        let t90 = null;
        if (slope < 0) {
            t90 = (95 - intercept) / slope; // Regulatory limit often 95%
        }

        return {
            slope: slope.toFixed(4),
            intercept: intercept.toFixed(2),
            predicted_t95: t90 ? Math.round(t90) : 'Extrapolates > 36M',
            regression_line: data.map(p => ({
                months: p.months,
                predicted_assay: (slope * p.months + intercept).toFixed(2)
            }))
        };
    }
}

module.exports = new StabilityPredictionService();
