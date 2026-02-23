import { jsPDF } from 'jspdf';

/**
 * Generates a professional PDF report for ROC Analysis
 * @param {Object} config - The ROC configuration data
 * @param {string} rocImageUrl - The URL of the ROC curve image
 */
export const generateROCPDF = async (config, rocImageUrl) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // -- Header Section --
    doc.setFillColor(30, 41, 59); // Slate-900 (matches dashboard theme)
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ROC Performance Vector', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Generated: ${timestamp}`, 140, 25);
    doc.text(`Cycle Trained: ${config.training_date}`, 20, 33);

    // -- Performance Metrics Section --
    let yPos = 55;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Neural Optimization Telemetry', 20, yPos);

    const metrics = [
        ['Optimal CI Threshold', config.optimal_ci_threshold.toString()],
        ['AUC Precision', config.model_performance.auc.toFixed(3)],
        ['Sensitivity', `${(config.model_performance.sensitivity * 100).toFixed(1)}%`],
        ['System Logic Accuracy', `${(config.model_performance.accuracy * 100).toFixed(1)}%`]
    ];

    yPos += 15;
    doc.setFontSize(11);
    metrics.forEach(([label, value]) => {
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 110, yPos);
        yPos += 8;
    });

    // -- ROC Curve Image --
    if (rocImageUrl) {
        try {
            const imgData = await getBase64Image(rocImageUrl);
            doc.addImage(imgData, 'PNG', 20, yPos + 5, 170, 100);
            yPos += 115;
        } catch (error) {
            console.error("Could not add ROC image to PDF:", error);
            doc.setTextColor(239, 68, 68); // Red-500
            doc.text('ROC Curve visualization not available in this report.', 20, yPos + 10);
            yPos += 20;
        }
    }

    // -- Risk Stratification Table --
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Threshold Stratification Matrix', 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    Object.entries(config.risk_classification).forEach(([level, info]) => {
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.roundedRect(20, yPos - 5, 170, 25, 3, 3, 'F');

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`${level} RISK ZONE [${info.ci_range[0]}-${info.ci_range[1]}]`, 25, yPos + 2);

        yPos += 8;
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'italic');
        const textLines = doc.splitTextToSize(info.description, 160);
        doc.text(textLines, 25, yPos);
        yPos += (textLines.length * 5) + 12;
    });

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Confidential - Pharmaceutical Optimization Vector - Page ${i} of ${pageCount}`, 105, 290, null, null, 'center');
    }

    doc.save(`ROC_Performance_Vector_${config.training_date.replace(/-/g, '')}.pdf`);
};

/**
 * Helper to fetch image and convert to base64
 */
async function getBase64Image(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
