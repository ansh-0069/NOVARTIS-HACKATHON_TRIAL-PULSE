import { jsPDF } from 'jspdf';

/**
 * Generates a comprehensive PDF report for the Analytics Overview
 * @param {Object} stats - The analytics statistics object
 */
export const generateAnalyticsPDF = (stats) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    let yPos = 20;

    // -- Header --
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Mass Balance Analytics', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Generated: ${timestamp}`, 20, 33);
    doc.text('Overview Report', 160, 25, { align: 'right' });

    yPos = 60;

    // -- KPI Cards --
    const cardWidth = 50;
    const cardHeight = 35;
    const gap = 10;
    const startX = 20;

    const drawKPI = (x, title, value, subtext, color) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'FD');

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), x + 5, yPos + 8);

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(value.toString(), x + 5, yPos + 20);

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(subtext, x + 5, yPos + 28);
    };

    drawKPI(startX, 'Total Analyses', stats.totalAnalyses, 'Completed tests', [59, 130, 246]);
    drawKPI(startX + cardWidth + gap, 'Pass Rate', `${stats.passRate}%`, 'ICH Q1A(R2) Compliant', [34, 197, 94]);
    drawKPI(startX + (cardWidth + gap) * 2, 'Avg Confidence', `${stats.avgConfidence}%`, 'Statistical Validity', [139, 92, 246]);

    yPos += cardHeight + 20; // Reduced gap

    // -- Status Analysis --
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, yPos, 170, 40, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Status Analysis', 25, yPos + 10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const statusText = "Mass balance limits are monitored against ICH thresholds. Deviations trigger automatic OOS investigations.";
    const splitStatusText = doc.splitTextToSize(statusText, 110);
    doc.text(splitStatusText, 25, yPos + 18);

    // Status Badge
    const isOOS = parseFloat(stats.passRate) < 95;
    const badgeColor = isOOS ? [254, 226, 226] : [220, 252, 231];
    const textColor = isOOS ? [185, 28, 28] : [21, 128, 61];
    const badgeText = isOOS ? 'OOS' : 'PASSING';
    const subText = isOOS ? 'Action Required' : 'Optimal';

    const badgeX = 145;
    const badgeY = yPos + 8;
    const badgeW = 35;
    const badgeH = 24;

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(badgeText, badgeX + badgeW / 2, badgeY + 10, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(subText, badgeX + badgeW / 2, badgeY + 18, { align: 'center' });

    yPos += 50;

    // --- PAGE BREAK CHECK 1 ---
    if (yPos + 90 > 280) { // Check if chart will fit
        doc.addPage();
        yPos = 20;
    }

    // -- Trend Chart --
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Mass Balance Trends (Recent 10 Samples)', 20, yPos);
    yPos += 12;

    const chartHeight = 60;
    const chartWidth = 170;
    const chartX = 20;
    const chartY = yPos;

    doc.setFillColor(248, 250, 252);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');

    if (stats.trendData && stats.trendData.length > 0) {
        const data = stats.trendData.slice(0, 10);
        const values = data.map(d => parseFloat(d.cimb || 0));
        let minVal = Math.min(...values);
        let maxVal = Math.max(...values);

        if (minVal === maxVal) { minVal -= 1; maxVal += 1; }
        const padding = (maxVal - minVal) * 0.2;
        const yMin = minVal - padding;
        const yMax = maxVal + padding;
        const yScale = chartHeight / (yMax - yMin);
        const xStep = chartWidth / Math.max(data.length - 1, 1);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');

        for (let i = 0; i <= 5; i++) {
            const y = chartY + (chartHeight * i / 5);
            doc.line(chartX, y, chartX + chartWidth, y);
            const labelVal = (yMax - ((yMax - yMin) * i / 5)).toFixed(1);
            doc.text(labelVal.toString(), chartX - 2, y + 2, { align: 'right' });
        }

        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.setFillColor(59, 130, 246);
        const mapY = (val) => chartY + chartHeight - ((val - yMin) * yScale);

        for (let i = 0; i < data.length - 1; i++) {
            const x1 = chartX + (i * xStep);
            const y1 = mapY(parseFloat(data[i].cimb || 0));
            const x2 = chartX + ((i + 1) * xStep);
            const y2 = mapY(parseFloat(data[i + 1].cimb || 0));
            doc.line(x1, y1, x2, y2);
            doc.circle(x1, y1, 1, 'F');
        }
        const lastX = chartX + ((data.length - 1) * xStep);
        const lastY = mapY(parseFloat(data[data.length - 1].cimb || 0));
        doc.circle(lastX, lastY, 1, 'F');
    } else {
        doc.setFontSize(10);
        doc.text('No trend data available', chartX + chartWidth / 2, chartY + chartHeight / 2, { align: 'center' });
    }

    yPos += chartHeight + 20;

    // --- PAGE BREAK CHECK 2 ---
    const methodSectionHeight = 20 + (stats.methodDistribution.length * 15);
    if (yPos + methodSectionHeight > 280) {
        doc.addPage();
        yPos = 20;
    }

    // -- Method Distribution --
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Methodology Distribution', 20, yPos);
    yPos += 10;

    stats.methodDistribution.forEach(item => {
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(item.name, 25, yPos + 5);

        doc.setFillColor(241, 245, 249);
        doc.rect(60, yPos, 100, 6, 'F');

        const barWidth = Math.min((parseFloat(item.percentage) / 100) * 100, 100);
        doc.setFillColor(139, 92, 246);
        doc.rect(60, yPos, barWidth, 6, 'F');

        doc.text(`${item.percentage}%`, 170, yPos + 5);
        yPos += 12; // Tighter spacing
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated by Mass Balance AI Platform - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Analytics_Overview_${timestamp.replace(/[:\/, ]/g, '_')}.pdf`);
};
