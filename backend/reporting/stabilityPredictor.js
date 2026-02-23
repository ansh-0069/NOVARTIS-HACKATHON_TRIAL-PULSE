/**
 * Stability Prediction Service
 * Uses linear regression to estimate degradation rates and shelf life
 * Conforms to ICH Q1A(R2) / Q1E: shelf life = time at which assay hits the lower
 * acceptance criterion (95% for most solid dosage forms).
 */
class StabilityPredictionService {
    /**
     * Predict shelf life (t95 — time to reach the 95% assay acceptance limit per ICH Q1E)
     * @param {Array} data - [{months, assay}]
     */
    predictShelfLife(data) {
        if (data.length < 2) return null;

        // Perform OLS Linear Regression (y = slope * x + intercept)
        // x = months elapsed, y = assay %
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

        // R-squared to indicate regression fit quality
        const meanY = sumY / n;
        const ssTot = data.reduce((acc, p) => acc + Math.pow(p.assay - meanY, 2), 0);
        const ssRes = data.reduce((acc, p) => acc + Math.pow(p.assay - (slope * p.months + intercept), 2), 0);
        const rSquared = ssTot > 0 ? (1 - ssRes / ssTot) : 1;

        // ICH Q1E shelf life: time at which the regression mean crosses the 95% acceptance limit
        // t95 = (95 - intercept) / slope  [only valid when slope < 0, i.e. degrading]
        let t95 = null;
        if (slope < 0) {
            t95 = Math.round((95 - intercept) / slope);
        }

        // Build regression line from T=0 to the predicted t95 (or T=36 if not degrading)
        // so the chart shows the full forecast vector, not just the observed window.
        const forecastEnd = t95 ? Math.min(t95 + 6, 60) : 36;
        const observedMonths = new Set(data.map(p => p.months));
        const allMonths = new Set([...observedMonths]);
        // Add extrapolated points every 3 months up to forecastEnd
        for (let m = 0; m <= forecastEnd; m += 3) allMonths.add(m);
        if (t95) allMonths.add(t95);

        const regression_line = [...allMonths].sort((a, b) => a - b).map(m => ({
            months: m,
            predicted_assay: parseFloat((slope * m + intercept).toFixed(2))
        }));

        return {
            slope: slope.toFixed(4),
            intercept: intercept.toFixed(2),
            r_squared: rSquared.toFixed(4),
            predicted_t95: t95 !== null ? t95 : 'Extrapolates > 36M',
            regression_line
        };
    }
}

module.exports = new StabilityPredictionService();

