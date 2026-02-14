import jsPDF from 'jspdf';

export const generatePDF = (resultsData, inputs) => {
  const {
    mb_results,
    correction_factors,
    recommended_method,
    recommended_value,
    status,
    diagnostic_message,
    rationale,
    degradation_level
  } = resultsData;

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

  // PAGE 3: METHOD COMPARISON
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

  doc.setFillColor(31, 78, 120);
  doc.rect(20, yPos, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Method', 25, yPos + 7);
  doc.text('Value (%)', 125, yPos + 7);
  doc.text('Status', 165, yPos + 7);

  yPos += 10;

  const methodsDetail = [
    {
      name: 'SMB',
      value: mb_results.smb,
      desc: 'Simple Mass Balance'
    },
    {
      name: 'AMB',
      value: mb_results.amb,
      desc: 'Absolute Mass Balance'
    },
    {
      name: 'RMB',
      value: mb_results.rmb || 'N/A',
      desc: 'Relative Mass Balance'
    },
    {
      name: 'LK-IMB',
      value: mb_results.lk_imb,
      desc: 'Lukulay-Korner IMB'
    },
    {
      name: 'CIMB',
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

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Correction Factors Applied', 20, yPos);

  yPos += 10;

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

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Diagnostic Assessment', 20, yPos);

  yPos += 8;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  const diagLines = doc.splitTextToSize(diagnostic_message || '', 160);
  diagLines.forEach(line => {
    doc.text(line, 25, yPos);
    yPos += 4;
  });

  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Scientific Rationale:', 20, yPos);
  yPos += 5;
  doc.setFont(undefined, 'normal');
  const rationaleLines = doc.splitTextToSize(rationale || '', 160);
  rationaleLines.forEach(line => {
    doc.text(line, 25, yPos);
    yPos += 4;
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Dual-Method Mass Balance Calculator v2.0 | LK-IMB + CIMB', 105, 285, { align: 'center' });
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });

  const filename = `Mass_Balance_Report_${new Date().toISOString().slice(0, 10)}_${recommended_method}.pdf`;
  doc.save(filename);
};
