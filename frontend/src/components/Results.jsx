import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';

function Results({ results }) {
  const { results: mb_results, correction_factors, recommended_method, recommended_value,
    status, diagnostic_message, rationale, confidence_index, degradation_level } = results;

  const chartData = [
    { method: 'SMB', value: mb_results.smb, fill: getColor(mb_results.smb) },
    { method: 'AMB', value: mb_results.amb, fill: getColor(mb_results.amb) },
    { method: 'RMB', value: mb_results.rmb || 0, fill: mb_results.rmb ? getColor(mb_results.rmb) : '#999' },
    { method: 'LK-IMB', value: mb_results.lk_imb, fill: getColor(mb_results.lk_imb) }
  ];

  function getColor(value) {
    if (value >= 95 && value <= 105) return '#10b981'; // Green
    if (value >= 90) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  const downloadPDF = () => {
    const doc = new jsPDF();

    // ==================== FEATURE 1: PROFESSIONAL COVER PAGE ====================

    // Background color for cover
    doc.setFillColor(31, 78, 120); // Dark blue
    doc.rect(0, 0, 210, 297, 'F');

    // White overlay box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(30, 40, 150, 180, 5, 5, 'F');

    // Company Logo Area (Using text as logo - you can replace with actual image)
    doc.setFillColor(31, 78, 120);
    doc.circle(105, 70, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('MB', 105, 75, { align: 'center' });

    // Main Title
    doc.setTextColor(31, 78, 120);
    doc.setFontSize(28);
    doc.text('PHARMACEUTICAL', 105, 110, { align: 'center' });
    doc.setFontSize(32);
    doc.text('MASS BALANCE', 105, 125, { align: 'center' });
    doc.text('REPORT', 105, 140, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Forced Degradation Study Analysis', 105, 155, { align: 'center' });
    doc.text('ICH Q1A(R2) Compliant', 105, 165, { align: 'center' });

    // Status Badge
    const statusColor = status === 'PASS' ? [16, 185, 129] :
      status === 'ALERT' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...statusColor);
    doc.roundedRect(70, 175, 70, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(status, 105, 185, { align: 'center' });

    // Date and Sample Info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 105, 200, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleTimeString()}`, 105, 207, { align: 'center' });

    // Footer on cover
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('AI-Powered Mass Balance Calculator v1.0', 105, 270, { align: 'center' });
    doc.text('Automated Pharmaceutical Analysis System', 105, 276, { align: 'center' });

    // ==================== PAGE 2: EXECUTIVE SUMMARY (FIXED) ====================
    doc.addPage();
    let yPos = 20;

    // Header
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

    // Summary Box
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(20, yPos, 170, 60, 3, 3, 'F');

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CONCLUSION:', 25, yPos);
    doc.setFont(undefined, 'normal');

    // FIX: Status icon replaced with safe text to avoid 'FAIL garbled rendering
    const statusIcon = status === 'PASS' ? 'PASS' : status === 'ALERT' ? 'ALERT' : 'FAIL';
    doc.setTextColor(...statusColor);
    doc.setFontSize(14);
    doc.text(statusIcon, 65, yPos);

    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const summaryText = `The sample demonstrates ${status === 'PASS' ? 'acceptable' : 'questionable'} mass balance under ${results.stress_type || 'stress'} conditions. ${recommended_method} method (${recommended_value}%) ${status === 'PASS' ? 'confirms product stability' : 'requires investigation'} with proper correction factors applied.`;
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
    // FIX: Standard hyphen used instead of bullet symbol '&'
    doc.text(`- Degradation Level: ${degradation_level}% ${degradation_level > 20 ? '(High)' : degradation_level > 5 ? '(Moderate)' : '(Low)'}`, 30, yPos);

    yPos += 5;
    // FIX: Greek symbols Lambda (λ) and Omega (ω) replaced with English text
    doc.text(`- Correction Factors: Lambda=${correction_factors.lambda}, Omega=${correction_factors.omega}`, 30, yPos);

    yPos += 5;
    const volatileStatus = mb_results.amb < 95 && correction_factors.lambda === 1.0 ? 'Suspected' : 'Not detected';
    doc.text(`- Volatile Loss: ${volatileStatus}`, 30, yPos);

    yPos += 5;
    const uvSilent = mb_results.amb < 95 && correction_factors.lambda > 1.2 ? 'Suspected' : 'Not detected';
    doc.text(`- UV-Silent Degradants: ${uvSilent}`, 30, yPos);

    // ... (Previous Key Findings code) ...
    doc.text(`- UV-Silent Degradants: ${uvSilent}`, 30, yPos);

    // FIX: Increased spacing to prevent "Risk Assessment" from overlapping
    yPos += 20;

    // ==================== FEATURE 4: COLOR-CODED RISK ASSESSMENT (FIXED) ====================
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Risk Assessment', 20, yPos);

    yPos += 10;

    // Risk matrix logic
    const riskLevel = recommended_value >= 95 && recommended_value <= 105 ? 'LOW' :
      recommended_value >= 90 ? 'MEDIUM' : 'HIGH';
    const riskColor = riskLevel === 'LOW' ? [16, 185, 129] :
      riskLevel === 'MEDIUM' ? [245, 158, 11] : [239, 68, 68];

    // --- GREEN ZONE ---
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(16, 120, 80);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    // FIX: Removed 🟢 emoji
    doc.text('GREEN ZONE (95-105%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('LOW RISK - Acceptable mass balance', 25, yPos + 10);

    // Selection Indicator
    if (riskLevel === 'LOW') {
      doc.setFillColor(16, 185, 129);
      doc.circle(180, yPos + 7, 3, 'F'); // Keep the circle
      // FIX: Removed '✓' text causing garbage chars
    }

    yPos += 18;

    // --- YELLOW ZONE ---
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 100, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    // FIX: Removed 🟡 emoji
    doc.text('YELLOW ZONE (90-95%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('MEDIUM RISK - Investigation required per ICH guidelines', 25, yPos + 10);

    if (riskLevel === 'MEDIUM') {
      doc.setFillColor(245, 158, 11);
      doc.circle(180, yPos + 7, 3, 'F');
      // FIX: Removed '⚠' text
    }

    yPos += 18;

    // --- RED ZONE ---
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(180, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    // FIX: Removed 🔴 emoji
    doc.text('RED ZONE (<90%)', 25, yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('HIGH RISK - Immediate action required, potential OOS', 25, yPos + 10);

    if (riskLevel === 'HIGH') {
      doc.setFillColor(239, 68, 68);
      doc.circle(180, yPos + 7, 3, 'F');
      // FIX: Removed '✗' text
    }

    yPos += 20;

    // Current Risk Status Box
    doc.setFillColor(...riskColor);
    doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`CURRENT RISK LEVEL: ${riskLevel}`, 105, yPos + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Mass Balance: ${recommended_value}%`, 105, yPos + 15, { align: 'center' });

    yPos += 30;


    // ==================== FEATURE 2: VISUAL MASS BALANCE GAUGE ====================
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Mass Balance Gauge', 20, yPos);

    yPos += 15;

    // Draw circular gauge
    const centerX = 105;
    const centerY = yPos + 30;
    const radius = 25;

    // Background arc (full circle)
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(8);
    doc.circle(centerX, centerY, radius, 'S');

    // Color zones on gauge
    // Red zone (0-90) - left side
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(8);
    for (let angle = 180; angle <= 234; angle += 2) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 2 - 90) * Math.PI / 180;
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      doc.line(x1, y1, x2, y2);
    }

    // Yellow zone (90-95)
    doc.setDrawColor(245, 158, 11);
    for (let angle = 234; angle <= 252; angle += 2) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 2 - 90) * Math.PI / 180;
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      doc.line(x1, y1, x2, y2);
    }

    // Green zone (95-105)
    doc.setDrawColor(16, 185, 129);
    for (let angle = 252; angle <= 288; angle += 2) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 2 - 90) * Math.PI / 180;
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      doc.line(x1, y1, x2, y2);
    }

    // Yellow zone (105-110)
    doc.setDrawColor(245, 158, 11);
    for (let angle = 288; angle <= 306; angle += 2) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 2 - 90) * Math.PI / 180;
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      doc.line(x1, y1, x2, y2);
    }

    // Red zone (110+)
    doc.setDrawColor(239, 68, 68);
    for (let angle = 306; angle <= 360; angle += 2) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 2 - 90) * Math.PI / 180;
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      doc.line(x1, y1, x2, y2);
    }

    // Needle/Pointer
    const needleValue = Math.min(Math.max(recommended_value, 80), 120); // Clamp between 80-120
    const needleAngle = 180 + ((needleValue - 80) / 40) * 180; // Map 80-120 to 180-360 degrees
    const needleRad = (needleAngle - 90) * Math.PI / 180;
    const needleEndX = centerX + (radius - 5) * Math.cos(needleRad);
    const needleEndY = centerY + (radius - 5) * Math.sin(needleRad);

    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(2);
    doc.line(centerX, centerY, needleEndX, needleEndY);

    // Center dot
    doc.setFillColor(50, 50, 50);
    doc.circle(centerX, centerY, 3, 'F');

    // Value text in center
    doc.setTextColor(...riskColor);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`${recommended_value}%`, centerX, centerY + 15, { align: 'center' });

    // Scale labels
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('80', centerX - 35, centerY + 5);
    doc.text('90', centerX - 25, centerY - 15);
    doc.text('95', centerX - 10, centerY - 25);
    doc.text('100', centerX, centerY - 30, { align: 'center' });
    doc.text('105', centerX + 10, centerY - 25);
    doc.text('110', centerX + 25, centerY - 15);
    doc.text('120', centerX + 35, centerY + 5);



    // ==================== PAGE 3: DECISION TREE (FIXED LAYOUT) ====================
    doc.addPage();
    yPos = 20;

    // Header
    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('METHOD SELECTION LOGIC', 105, 10, { align: 'center' });

    yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Decision Tree', 20, yPos);

    yPos += 15;

    // --- START NODE ---
    doc.setFillColor(31, 78, 120);
    doc.roundedRect(75, yPos, 60, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('START', 105, yPos + 10, { align: 'center' });

    // Arrow down
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(105, yPos + 15, 105, yPos + 25);
    doc.line(105, yPos + 25, 102, yPos + 22);
    doc.line(105, yPos + 25, 108, yPos + 22);

    yPos += 25;

    // --- DECISION 1 ---
    const deg = parseFloat(degradation_level);
    doc.setFillColor(255, 243, 205);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.roundedRect(60, yPos, 90, 20, 3, 3, 'FD'); // Box from X=60 to X=150
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Degradation < 2%?', 105, yPos + 8, { align: 'center' });
    doc.text(`(Current: ${degradation_level}%)`, 105, yPos + 15, { align: 'center' });

    yPos += 20;

    // Line Left (YES) - From Bottom-Left of Box
    doc.setDrawColor(16, 185, 129);
    doc.line(60, yPos - 5, 45, yPos + 10); // Diagonal line down-left
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('YES', 45, yPos);

    // AMB Box (Far Left)
    doc.setFillColor(...(deg < 2 ? [220, 252, 231] : [245, 245, 245]));
    doc.setDrawColor(...(deg < 2 ? [16, 185, 129] : [200, 200, 200]));
    doc.roundedRect(15, yPos + 10, 60, 15, 3, 3, 'FD');
    doc.setTextColor(...(deg < 2 ? [16, 120, 80] : [100, 100, 100]));
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('AMB', 45, yPos + 20, { align: 'center' });
    if (deg < 2) {
      doc.setFillColor(16, 185, 129);
      doc.circle(65, yPos + 17, 3, 'F');
    }

    // Line Right (NO) - From Bottom-Right of Box
    doc.setDrawColor(239, 68, 68);
    doc.line(150, yPos - 5, 155, yPos + 10); // Diagonal line down-right
    doc.setTextColor(239, 68, 68);
    doc.text('NO', 158, yPos);

    // --- DECISION 2 (Shifted Right) ---
    doc.setFillColor(255, 243, 205);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(120, yPos + 10, 70, 15, 3, 3, 'FD'); // Box from X=120 to X=190
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('5% <= Deg <= 20%?', 155, yPos + 20, { align: 'center' });

    yPos += 25;

    // Line Left (YES) - From Bottom-Left of Dec 2
    doc.setDrawColor(16, 185, 129);
    doc.line(120, yPos, 110, yPos + 10);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(8);
    doc.text('YES', 110, yPos + 5);

    // RMB Box (Center-Left)
    doc.setFillColor(...(deg >= 5 && deg <= 20 ? [220, 252, 231] : [245, 245, 245]));
    doc.setDrawColor(...(deg >= 5 && deg <= 20 ? [16, 185, 129] : [200, 200, 200]));
    doc.roundedRect(80, yPos + 10, 60, 15, 3, 3, 'FD'); // X=80
    doc.setTextColor(...(deg >= 5 && deg <= 20 ? [16, 120, 80] : [100, 100, 100]));
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('RMB', 110, yPos + 20, { align: 'center' });
    if (deg >= 5 && deg <= 20) {
      doc.setFillColor(16, 185, 129);
      doc.circle(130, yPos + 17, 3, 'F');
    }

    // Line Right (NO) - From Bottom-Right of Dec 2
    doc.setDrawColor(239, 68, 68);
    doc.line(190, yPos, 195, yPos + 10);
    doc.setTextColor(239, 68, 68);
    doc.text('NO', 198, yPos + 5);

    // LK-IMB Box (Far Right - Adjusted to fit page)
    doc.setFillColor(...(deg > 20 ? [220, 252, 231] : [245, 245, 245]));
    doc.setDrawColor(...(deg > 20 ? [16, 185, 129] : [200, 200, 200]));
    doc.roundedRect(165, yPos + 10, 40, 15, 3, 3, 'FD'); // Ends at X=205 (Safe margin)
    doc.setTextColor(...(deg > 20 ? [16, 120, 80] : [100, 100, 100]));
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LK-IMB', 185, yPos + 20, { align: 'center' });
    if (deg > 20) {
      doc.setFillColor(16, 185, 129);
      doc.circle(200, yPos + 17, 3, 'F');
    }

    yPos += 40;


    // Selected method highlight (Rest of the page remains the same)
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F');




    // ==================== PAGE 4: DETAILED RESULTS (FIXED LAYOUT) ====================
    doc.addPage();
    yPos = 20;

    // Header
    doc.setFillColor(31, 78, 120);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED RESULTS', 105, 10, { align: 'center' });

    yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Calculation Results', 20, yPos);

    yPos += 10;

    // Results table header
    doc.setFillColor(31, 78, 120);
    doc.rect(20, yPos, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Method', 25, yPos + 7);
    doc.text('Formula', 70, yPos + 7);
    doc.text('Value (%)', 130, yPos + 7);
    doc.text('Status', 165, yPos + 7);

    yPos += 10;

    // FIX: Formulas updated to use plain text (no symbols or smart quotes)
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
        // FIX: Removed garbage quotes "Deg/"API
        formula: 'Deg / API * 100',
        value: mb_results.rmb || 'N/A',
        desc: 'Relative Mass Balance'
      },
      {
        name: 'LK-IMB',
        // FIX: Replaced Greek symbols with English words
        formula: '[API + (Deg * Lambda * Omega)] / Init * 100',
        value: mb_results.lk_imb,
        desc: 'Corrected Mass Balance'
      }
    ];

    doc.setTextColor(0, 0, 0);
    methodsDetail.forEach((method, index) => {
      const bgColor = index % 2 === 0 ? 250 : 255;
      doc.setFillColor(bgColor, bgColor, bgColor);
      doc.rect(20, yPos, 170, 12, 'F');

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(method.name, 25, yPos + 5);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.text(method.desc, 25, yPos + 9);

      doc.setFontSize(7);
      doc.text(method.formula, 70, yPos + 7);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(method.value === 'N/A' ? 'N/A' : method.value.toFixed(2), 135, yPos + 7);

      if (method.value !== 'N/A') {
        const val = method.value;
        if (val >= 95 && val <= 105) {
          doc.setTextColor(16, 185, 129); // Green
          doc.setFontSize(8);
          doc.text('PASS', 165, yPos + 7);
        } else if (val >= 90) {
          doc.setTextColor(245, 158, 11); // Orange
          doc.setFontSize(8);
          doc.text('ALERT', 165, yPos + 7);
        } else {
          doc.setTextColor(239, 68, 68); // Red
          doc.setFontSize(8);
          doc.text('FAIL', 165, yPos + 7);
        }
        doc.setTextColor(0, 0, 0);
      }

      yPos += 12;
    });

    yPos += 10;

    // Correction Factors
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Correction Factors', 20, yPos);

    yPos += 10;

    // FIX: Clean labels without Greek symbols
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, yPos, 80, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Lambda (RRF Correction)', 25, yPos + 7);
    doc.setFontSize(16);
    doc.setTextColor(31, 78, 120);
    doc.text(`${correction_factors.lambda}`, 60, yPos + 18, { align: 'center' });

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(110, yPos, 80, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Omega (MW Correction)', 115, yPos + 7);
    doc.setFontSize(16);
    doc.setTextColor(31, 78, 120);
    doc.text(`${correction_factors.omega}`, 150, yPos + 18, { align: 'center' });

    yPos += 35;

    // Diagnostic Assessment
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Diagnostic Assessment', 20, yPos);

    yPos += 10;

    // FIX: Prevent Overlap
    // 1. Strip garbage characters like '&'
    const safeDiagnostic = diagnostic_message.replace(/^[^\w\s]+/, '');
    const diagnosticLines = doc.splitTextToSize(safeDiagnostic || diagnostic_message, 160);

    // 2. Calculate dynamic box height based on text length (minimum 30)
    const lineHeight = 6;
    const padding = 10;
    const diagBoxHeight = Math.max(30, (diagnosticLines.length * lineHeight) + padding);

    // 3. Draw box with calculated height
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

    // 4. Update yPos to start AFTER the diagnostic box
    yPos += diagBoxHeight + 15;

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
    const complianceText = 'This calculation follows ICH Q1A(R2) guidelines for mass balance assessment. Values between 95-105% are acceptable. Values outside this range require investigation.';
    const complianceLines = doc.splitTextToSize(complianceText, 160);
    complianceLines.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += 4;
    });

    // Footer
    const now = new Date();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Mass Balance Calculator v1.0 | AI-Powered Pharmaceutical Analysis', 105, 285, { align: 'center' });
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });

    const filename = `Mass_Balance_Report_${new Date().toISOString().slice(0, 10)}_${recommended_method}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(mb_results).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              {key.toUpperCase().replace('_', '-')}
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
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Mass Balance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis domain={[80, 110]} />
            <Tooltip />
            <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label="Lower Limit (95%)" />
            <ReferenceLine y={105} stroke="#10b981" strokeDasharray="3 3" label="Upper Limit (105%)" />
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
        Download Professional PDF Report
      </button>
    </div>
  );
}

export default Results;