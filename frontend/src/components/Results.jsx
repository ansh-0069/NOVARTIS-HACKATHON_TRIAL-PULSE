import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Download, CheckCircle, AlertTriangle, XCircle, TrendingUp, Activity } from 'lucide-react';
import jsPDF from 'jspdf';

function Results({ results }) {
  const { results: mb_results, correction_factors, recommended_method, recommended_value,
    status, diagnostic_message, rationale, confidence_index, degradation_level } = results;

  const chartData = [
    { method: 'SMB', value: mb_results.smb, fill: getColor(mb_results.smb) },
    { method: 'AMB', value: mb_results.amb, fill: getColor(mb_results.amb) },
    { method: 'RMB', value: mb_results.rmb || 0, fill: mb_results.rmb ? getColor(mb_results.rmb) : '#999' },
    { method: 'LK-IMB', value: mb_results.lk_imb, fill: getColor(mb_results.lk_imb) },
    { method: 'CIMB', value: mb_results.cimb, fill: getColor(mb_results.cimb) }
  ];

  function getColor(value) {
    if (value >= 95 && value <= 105) return '#10b981'; // Green
    if (value >= 90) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  const downloadPDF = () => {
    const doc = new jsPDF();

    // ==================== COVER PAGE ====================
    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(30, 40, 150, 180, 5, 5, 'F');

    doc.setFillColor(31, 78, 120);
    doc.circle(105, 70, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('MB', 105, 75, { align: 'center' });

    doc.setTextColor(31, 78, 120);
    doc.setFontSize(28);
    doc.text('PHARMACEUTICAL', 105, 110, { align: 'center' });
    doc.setFontSize(32);
    doc.text('MASS BALANCE', 105, 125, { align: 'center' });
    doc.text('REPORT', 105, 140, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Forced Degradation Study Analysis', 105, 155, { align: 'center' });
    doc.text('ICH Q1A(R2) Compliant - CIMB Enhanced', 105, 165, { align: 'center' });

    const statusColor = status === 'PASS' ? [16, 185, 129] :
      status === 'ALERT' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...statusColor);
    doc.roundedRect(70, 175, 70, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(status, 105, 185, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 105, 200, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleTimeString()}`, 105, 207, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('Dual-Method Mass Balance Calculator v2.0', 105, 270, { align: 'center' });
    doc.text('LK-IMB + CIMB Integration', 105, 276, { align: 'center' });

    // ==================== PAGE 2: EXECUTIVE SUMMARY ====================
    doc.addPage();
    let yPos = 20;

    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('EXECUTIVE SUMMARY', 105, 10, { align: 'center' });

    yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Analysis Overview', 20, yPos);

    yPos += 10;

    doc.setFillColor(240, 249, 255);
    doc.roundedRect(20, yPos, 170, 70, 3, 3, 'F');

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CONCLUSION:', 25, yPos);
    doc.setFont(undefined, 'normal');

    const statusIcon = status === 'PASS' ? 'PASS' : status === 'ALERT' ? 'ALERT' : 'FAIL';
    doc.setTextColor(...statusColor);
    doc.setFontSize(14);
    doc.text(statusIcon, 65, yPos);

    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const summaryText = `The sample demonstrates ${status === 'PASS' ? 'acceptable' : 'questionable'} mass balance. ${recommended_method} method (${recommended_value}%) ${status === 'PASS' ? 'confirms product stability' : 'requires investigation'} with proper correction factors applied.`;
    const summaryLines = doc.splitTextToSize(summaryText, 160);
    summaryLines.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += 5;
    });

    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text('KEY FINDINGS:', 25, yPos);

    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`- Degradation Level: ${degradation_level}% ${degradation_level > 20 ? '(High)' : degradation_level > 5 ? '(Moderate)' : '(Low)'}`, 30, yPos);

    yPos += 5;
    doc.text(`- Correction Factors: Lambda=${correction_factors.lambda}, Omega=${correction_factors.omega}, S=${correction_factors.stoichiometric_factor}`, 30, yPos);

    yPos += 5;
    doc.text(`- CIMB Result: ${mb_results.cimb}% (95% CI: ${mb_results.cimb_lower_ci}% - ${mb_results.cimb_upper_ci}%)`, 30, yPos);

    yPos += 5;
    doc.text(`- CIMB Risk Level: ${mb_results.cimb_risk_level}`, 30, yPos);

    yPos += 5;
    const volatileStatus = mb_results.amb < 95 && correction_factors.lambda === 1.0 ? 'Suspected' : 'Not detected';
    doc.text(`- Volatile Loss: ${volatileStatus}`, 30, yPos);


    yPos += 5;
    const uvSilent = mb_results.amb < 95 && correction_factors.lambda > 1.2 ? 'Suspected' : 'Not detected';
    doc.text(`- UV-Silent Degradants: ${uvSilent}`, 30, yPos);

    yPos += 20;

    // ==================== LK-IMB CONFIDENCE INTERVAL VISUALIZATION ====================
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('LK-IMB Statistical Analysis', 20, yPos);

    yPos += 10;

    // Draw confidence interval range for LK-IMB
    const lkCiRangeBoxHeight = 40;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);

    // Scale: 85% to 115%
    const lkScaleMin = 85;
    const lkScaleMax = 115;
    const lkScaleWidth = 160;
    const lkScaleX = 25;

    // Draw scale line
    doc.line(lkScaleX, yPos + 20, lkScaleX + lkScaleWidth, yPos + 20);

    // Draw tick marks and labels
    for (let i = lkScaleMin; i <= lkScaleMax; i += 5) {
      const x = lkScaleX + ((i - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
      doc.line(x, yPos + 18, x, yPos + 22);
      doc.setFontSize(8);
      doc.text(`${i}`, x, yPos + 28, { align: 'center' });
    }

    // Draw acceptable range (95-105%)
    const lkAcceptMinX = lkScaleX + ((95 - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    const lkAcceptMaxX = lkScaleX + ((105 - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setFillColor(220, 252, 231);
    doc.rect(lkAcceptMinX, yPos + 10, lkAcceptMaxX - lkAcceptMinX, 20, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(lkAcceptMinX, yPos + 10, lkAcceptMaxX - lkAcceptMinX, 20);

    // Draw LK-IMB point estimate
    const lkImbX = lkScaleX + ((mb_results.lk_imb - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setFillColor(22, 163, 74); // Green color for LK-IMB
    doc.circle(lkImbX, yPos + 20, 3, 'F');

    // Draw confidence interval for LK-IMB
    const lkCiLowerX = lkScaleX + ((mb_results.lk_imb_lower_ci - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    const lkCiUpperX = lkScaleX + ((mb_results.lk_imb_upper_ci - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(2);
    doc.line(lkCiLowerX, yPos + 20, lkCiUpperX, yPos + 20);
    doc.line(lkCiLowerX, yPos + 17, lkCiLowerX, yPos + 23);
    doc.line(lkCiUpperX, yPos + 17, lkCiUpperX, yPos + 23);

    // Labels
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text(`LK-IMB: ${mb_results.lk_imb}%`, lkImbX, yPos + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`95% CI: [${mb_results.lk_imb_lower_ci}%, ${mb_results.lk_imb_upper_ci}%]`, 105, yPos + 35, { align: 'center' });

    yPos += 50;

    // LK-IMB Risk Assessment
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('LK-IMB Risk Assessment', 20, yPos);

    yPos += 10;

    const lkRiskLevel = mb_results.lk_imb_risk_level;
    const lkRiskColor = lkRiskLevel === 'LOW' ? [16, 185, 129] :
      lkRiskLevel === 'MODERATE' ? [245, 158, 11] : [239, 68, 68];

    // LOW RISK
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(16, 120, 80);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LOW RISK (98-102%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Excellent mass balance - No action required', 25, yPos + 10);
    if (lkRiskLevel === 'LOW') {
      doc.setFillColor(16, 185, 129);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 18;

    // MODERATE RISK
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 100, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('MODERATE RISK (95-98% or 102-105%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Acceptable with justification - Document rationale', 25, yPos + 10);
    if (lkRiskLevel === 'MODERATE') {
      doc.setFillColor(245, 158, 11);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 18;

    // HIGH RISK
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('HIGH RISK (<95% or >105%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Investigation required - Orthogonal analysis recommended', 25, yPos + 10);
    if (lkRiskLevel === 'HIGH') {
      doc.setFillColor(239, 68, 68);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 20;

    // Current Risk Status for LK-IMB
    doc.setFillColor(...lkRiskColor);
    doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`LK-IMB RISK LEVEL: ${lkRiskLevel}`, 105, yPos + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`LK-IMB: ${mb_results.lk_imb}% (CI: ${mb_results.lk_imb_lower_ci}% - ${mb_results.lk_imb_upper_ci}%)`, 105, yPos + 15, { align: 'center' });

    yPos += 30;

    // ==================== PAGE 3: CIMB STATISTICAL ANALYSIS ====================
    doc.addPage();
    yPos = 20;

    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CIMB STATISTICAL ANALYSIS', 105, 10, { align: 'center' });

    yPos = 30;

    // ==================== CIMB CONFIDENCE INTERVAL VISUALIZATION ====================
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CIMB Statistical Analysis', 20, yPos);

    yPos += 10;

    // Draw confidence interval range
    const ciRangeBoxHeight = 40;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);

    // Scale: 85% to 115%
    const scaleMin = 85;
    const scaleMax = 115;
    const scaleWidth = 160;
    const scaleX = 25;

    // Draw scale line
    doc.line(scaleX, yPos + 20, scaleX + scaleWidth, yPos + 20);

    // Draw tick marks and labels
    for (let i = scaleMin; i <= scaleMax; i += 5) {
      const x = scaleX + ((i - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
      doc.line(x, yPos + 18, x, yPos + 22);
      doc.setFontSize(8);
      doc.text(`${i}`, x, yPos + 28, { align: 'center' });
    }

    // Draw acceptable range (95-105%)
    const acceptMinX = scaleX + ((95 - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    const acceptMaxX = scaleX + ((105 - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setFillColor(220, 252, 231);
    doc.rect(acceptMinX, yPos + 10, acceptMaxX - acceptMinX, 20, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(acceptMinX, yPos + 10, acceptMaxX - acceptMinX, 20);

    // Draw CIMB point estimate
    const cimbX = scaleX + ((mb_results.cimb - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setFillColor(31, 78, 120);
    doc.circle(cimbX, yPos + 20, 3, 'F');

    // Draw confidence interval
    const ciLowerX = scaleX + ((mb_results.cimb_lower_ci - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    const ciUpperX = scaleX + ((mb_results.cimb_upper_ci - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setDrawColor(31, 78, 120);
    doc.setLineWidth(2);
    doc.line(ciLowerX, yPos + 20, ciUpperX, yPos + 20);
    doc.line(ciLowerX, yPos + 17, ciLowerX, yPos + 23);
    doc.line(ciUpperX, yPos + 17, ciUpperX, yPos + 23);

    // Labels
    doc.setFontSize(9);
    doc.setTextColor(31, 78, 120);
    doc.text(`CIMB: ${mb_results.cimb}%`, cimbX, yPos + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`95% CI: [${mb_results.cimb_lower_ci}%, ${mb_results.cimb_upper_ci}%]`, 105, yPos + 35, { align: 'center' });

    yPos += 50;


    // ==================== RISK ASSESSMENT ====================
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CIMB Risk Assessment', 20, yPos);

    yPos += 10;

    const riskLevel = mb_results.cimb_risk_level;
    const riskColor = riskLevel === 'LOW' ? [16, 185, 129] :
      riskLevel === 'MODERATE' ? [245, 158, 11] : [239, 68, 68];

    // LOW RISK
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(16, 120, 80);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LOW RISK (98-102%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Excellent mass balance - No action required', 25, yPos + 10);
    if (riskLevel === 'LOW') {
      doc.setFillColor(16, 185, 129);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 18;

    // MODERATE RISK
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 100, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('MODERATE RISK (95-98% or 102-105%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Acceptable with justification - Document rationale', 25, yPos + 10);
    if (riskLevel === 'MODERATE') {
      doc.setFillColor(245, 158, 11);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 18;

    // HIGH RISK
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('HIGH RISK (<95% or >105%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Investigation required - Orthogonal analysis recommended', 25, yPos + 10);
    if (riskLevel === 'HIGH') {
      doc.setFillColor(239, 68, 68);
      doc.circle(180, yPos + 7, 3, 'F');
    }

    yPos += 20;

    // Current Risk Status
    doc.setFillColor(...riskColor);
    doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`CURRENT RISK LEVEL: ${riskLevel}`, 105, yPos + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`CIMB: ${mb_results.cimb}% (CI: ${mb_results.cimb_lower_ci}% - ${mb_results.cimb_upper_ci}%)`, 105, yPos + 15, { align: 'center' });

    // ==================== PAGE 4: METHOD COMPARISON ====================
    doc.addPage();
    yPos = 20;

    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('METHOD COMPARISON & RESULTS', 105, 10, { align: 'center' });

    yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('All Methods Results', 20, yPos);

    yPos += 10;

    // Results table
    doc.setFillColor(31, 78, 120);
    doc.rect(20, yPos, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Method', 25, yPos + 7);
    doc.text('Formula', 65, yPos + 7);
    doc.text('Value (%)', 125, yPos + 7);
    doc.text('Status', 165, yPos + 7);

    yPos += 10;

    const methodsDetail = [
      {
        name: 'SMB',
        formula: 'API + Deg',
        value: mb_results.smb,
        desc: 'Simple Mass Balance'
      },
      {
        name: 'AMB',
        formula: '(API + Deg) / Init * 100',
        value: mb_results.amb,
        desc: 'Absolute Mass Balance'
      },
      {
        name: 'RMB',
        formula: 'Deg / API * 100',
        value: mb_results.rmb || 'N/A',
        desc: 'Relative Mass Balance'
      },
      {
        name: 'LK-IMB',
        formula: '[API + (Deg * L * O)] / Init * 100',
        value: mb_results.lk_imb,
        desc: 'Lukulay-Korner IMB'
      },
      {
        name: 'CIMB',
        formula: '[API + (Deg * L * S)] / Init * 100',
        value: mb_results.cimb,
        desc: 'Corrected IMB with CI'
      }
    ];

    doc.setTextColor(0, 0, 0);
    methodsDetail.forEach((method, index) => {
      const bgColor = index % 2 === 0 ? 250 : 255;
      const isRecommended = method.name === recommended_method;

      if (isRecommended) {
        doc.setFillColor(220, 252, 231);
      } else {
        doc.setFillColor(bgColor, bgColor, bgColor);
      }
      doc.rect(20, yPos, 170, 12, 'F');

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(method.name + (isRecommended ? ' *' : ''), 25, yPos + 5);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.text(method.desc, 25, yPos + 9);

      doc.setFontSize(7);
      doc.text(method.formula, 65, yPos + 7);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(method.value === 'N/A' ? 'N/A' : method.value.toFixed(2), 130, yPos + 7);

      if (method.value !== 'N/A') {
        const val = method.value;
        if (val >= 95 && val <= 105) {
          doc.setTextColor(16, 185, 129);
          doc.setFontSize(8);
          doc.text('PASS', 165, yPos + 7);
        } else if (val >= 90) {
          doc.setTextColor(245, 158, 11);
          doc.setFontSize(8);
          doc.text('ALERT', 165, yPos + 7);
        } else {
          doc.setTextColor(239, 68, 68);
          doc.setFontSize(8);
          doc.text('FAIL', 165, yPos + 7);
        }
        doc.setTextColor(0, 0, 0);
      }

      yPos += 12;
    });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('* Recommended method for this analysis', 25, yPos + 3);

    yPos += 15;

    // Correction Factors Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Correction Factors Applied', 20, yPos);

    yPos += 10;

    // Three correction factors in a row
    const factorWidth = 56;
    const factorSpacing = 57;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, yPos, factorWidth, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Lambda (RRF)', 25, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text(`${correction_factors.lambda}`, 48, yPos + 18, { align: 'center' });

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20 + factorSpacing, yPos, factorWidth, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Omega (MW)', 82, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text(`${correction_factors.omega}`, 105, yPos + 18, { align: 'center' });

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20 + (factorSpacing * 2), yPos, factorWidth, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('S (Pathway)', 139, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 120);
    doc.text(`${correction_factors.stoichiometric_factor}`, 162, yPos + 18, { align: 'center' });

    yPos += 35;

    // Diagnostic Assessment
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Diagnostic Assessment', 20, yPos);

    yPos += 10;

    const safeDiagnostic = diagnostic_message.replace(/^[^\w\s]+/, '');
    const diagnosticLines = doc.splitTextToSize(safeDiagnostic || diagnostic_message, 160);
    const lineHeight = 6;
    const padding = 10;
    const diagBoxHeight = Math.max(30, (diagnosticLines.length * lineHeight) + padding);

    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, yPos, 170, diagBoxHeight, 3, 3, 'FD');

    let textY = yPos + 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    diagnosticLines.forEach(line => {
      doc.text(line, 25, textY);
      textY += lineHeight;
    });

    yPos += diagBoxHeight + 15;

    // Rationale
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Scientific Rationale:', 20, yPos);

    yPos += 7;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const rationaleLines = doc.splitTextToSize(rationale, 160);
    rationaleLines.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += 5;
    });

    yPos += 10;

    // ICH Compliance
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(20, yPos, 170, 30, 3, 3, 'F');

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(31, 78, 120);
    doc.text('ICH Q1A(R2) Compliance', 25, yPos);

    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const complianceText = 'This calculation follows ICH Q1A(R2) guidelines. CIMB method provides enhanced statistical validation with 95% confidence intervals for regulatory submissions.';
    const complianceLines = doc.splitTextToSize(complianceText, 160);
    complianceLines.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += 4;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Dual-Method Mass Balance Calculator v2.0 | LK-IMB + CIMB', 105, 285, { align: 'center' });
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });

    const filename = `Mass_Balance_Report_${new Date().toISOString().slice(0, 10)}_${recommended_method}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Results Cards - Now includes CIMB */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(mb_results).filter(([key]) =>
          ['smb', 'amb', 'rmb', 'lk_imb', 'cimb'].includes(key)
        ).map(([key, value]) => (
          <div key={key} className={`bg-white rounded-lg shadow-md p-4 ${key === recommended_method.toLowerCase().replace('-', '_') ? 'ring-2 ring-blue-500' : ''
            }`}>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              {key.toUpperCase().replace('_', '-')}
              {key === recommended_method.toLowerCase().replace('-', '_') && ' ★'}
            </h3>
            <div
              className={`text-3xl font-bold rounded-lg p-3 text-center ${value === null ? 'bg-gray-200 text-gray-500' :
                value >= 95 && value <= 105 ? 'bg-green-100 text-green-700' :
                  value >= 90 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}
            >
              {value === null ? 'N/A' : `${value}%`}
            </div>
          </div>
        ))}
      </div>

      {/* LK-IMB Confidence Interval Display */}
      {mb_results.lk_imb && mb_results.lk_imb_lower_ci && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-green-600" size={28} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                LK-IMB Statistical Analysis
              </h3>
              <p className="text-sm text-gray-600">Point Estimate with 95% Confidence Interval</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Lower CI (95%)</div>
              <div className="text-2xl font-bold text-green-600">{mb_results.lk_imb_lower_ci}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center ring-2 ring-green-500">
              <div className="text-sm text-gray-600">LK-IMB Point Estimate</div>
              <div className="text-3xl font-bold text-green-700">{mb_results.lk_imb}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Upper CI (95%)</div>
              <div className="text-2xl font-bold text-green-600">{mb_results.lk_imb_upper_ci}%</div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Risk Level:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${mb_results.lk_imb_risk_level === 'LOW' ? 'bg-green-100 text-green-700' :
                mb_results.lk_imb_risk_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {mb_results.lk_imb_risk_level}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {mb_results.lk_imb_risk_level === 'LOW' && 'Excellent mass balance (98-102%). No action required.'}
              {mb_results.lk_imb_risk_level === 'MODERATE' && 'Acceptable with justification (95-98% or 102-105%). Document rationale.'}
              {mb_results.lk_imb_risk_level === 'HIGH' && 'Investigation required (<95% or >105%). Consider orthogonal analysis.'}
            </div>
          </div>
        </div>
      )}

      {/* CIMB Confidence Interval Display */}
      {mb_results.cimb && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-blue-600" size={28} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                CIMB Statistical Analysis
              </h3>
              <p className="text-sm text-gray-600">Point Estimate with 95% Confidence Interval</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Lower CI (95%)</div>
              <div className="text-2xl font-bold text-blue-600">{mb_results.cimb_lower_ci}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center ring-2 ring-blue-500">
              <div className="text-sm text-gray-600">CIMB Point Estimate</div>
              <div className="text-3xl font-bold text-blue-700">{mb_results.cimb}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Upper CI (95%)</div>
              <div className="text-2xl font-bold text-blue-600">{mb_results.cimb_upper_ci}%</div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Risk Level:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${mb_results.cimb_risk_level === 'LOW' ? 'bg-green-100 text-green-700' :
                mb_results.cimb_risk_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {mb_results.cimb_risk_level}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {mb_results.cimb_risk_level === 'LOW' && 'Excellent mass balance (98-102%). No action required.'}
              {mb_results.cimb_risk_level === 'MODERATE' && 'Acceptable with justification (95-98% or 102-105%). Document rationale.'}
              {mb_results.cimb_risk_level === 'HIGH' && 'Investigation required (<95% or >105%). Consider orthogonal analysis.'}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Method Banner */}
      <div className={`rounded-lg p-6 ${status === 'PASS' ? 'bg-green-50 border-2 border-green-300' :
        status === 'ALERT' ? 'bg-yellow-50 border-2 border-yellow-300' :
          'bg-red-50 border-2 border-red-300'
        }`}>
        <div className="flex items-center gap-4">
          {status === 'PASS' ? <CheckCircle className="text-green-600" size={32} /> :
            status === 'ALERT' ? <AlertTriangle className="text-yellow-600" size={32} /> :
              <XCircle className="text-red-600" size={32} />}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">
              Recommended Method: {recommended_method}
            </h3>
            <p className="text-2xl font-bold mt-1">
              Final Mass Balance: {recommended_value}% ({status})
            </p>
            <p className="text-sm text-gray-600 mt-2">{rationale}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence Index</div>
            <div className="text-2xl font-bold">{confidence_index}%</div>
          </div>
        </div>
      </div>

      {/* Correction Factors */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Correction Factors
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600">Lambda (λ) - RRF</div>
            <div className="text-2xl font-bold text-blue-600">{correction_factors.lambda}</div>
            <div className="text-xs text-gray-500 mt-1">Response Factor Correction</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600">Omega (ω) - MW</div>
            <div className="text-2xl font-bold text-blue-600">{correction_factors.omega}</div>
            <div className="text-xs text-gray-500 mt-1">Molecular Weight Correction</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600">S - Pathway</div>
            <div className="text-2xl font-bold text-blue-600">{correction_factors.stoichiometric_factor}</div>
            <div className="text-xs text-gray-500 mt-1">Stoichiometric Factor (CIMB)</div>
          </div>
        </div>
      </div>

      {/* Diagnostic Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Diagnostic Assessment</h3>
        <p className="text-gray-700">{diagnostic_message}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Degradation Level:</span> {degradation_level}%
          </div>
          <div>
            <span className="font-semibold">Lambda (RRF):</span> {correction_factors.lambda}
          </div>
          <div>
            <span className="font-semibold">Omega (MW):</span> {correction_factors.omega}
          </div>
          <div>
            <span className="font-semibold">Stoichiometric (S):</span> {correction_factors.stoichiometric_factor}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Mass Balance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis
              domain={[80, 110]}
              ticks={[80, 85, 90, 95, 100, 105, 110]}
              label={{ value: 'Mass Balance (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Lower Limit (95%)", position: "right" }} strokeWidth={2} />
            <ReferenceLine y={105} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Upper Limit (105%)", position: "right" }} strokeWidth={2} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-bold flex items-center justify-center gap-2 shadow-lg"
      >
        <Download size={24} />
        Download Enhanced PDF Report
      </button>
    </div>
  );
}

export default Results;