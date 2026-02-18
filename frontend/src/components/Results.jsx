import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Download, CheckCircle, AlertTriangle, XCircle, TrendingUp,
  Activity, BarChart3, Shield, FileText, Share2, Zap, Target
} from 'lucide-react';
import jsPDF from 'jspdf';
import axios from 'axios';
import MLAnomaly from './MLAnomaly';
import BayesianAnalysis from './BayesianAnalysis';
import { generatePDF } from '../utils/pdfGenerator';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-2xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.value.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

function Results({ results, inputs }) {
  const [activeView, setActiveView] = useState('overview');
  const [exportFormat, setExportFormat] = useState('pdf');

  const { results: mb_results, correction_factors, recommended_method, recommended_value,
    status, diagnostic_message, rationale, confidence_index, degradation_level } = results;

  // Define getStatusConfig BEFORE using it
  const getStatusConfig = (value) => {
    if (value >= 98 && value <= 102) {
      return {
        icon: CheckCircle,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        label: 'EXCELLENT',
        gradient: 'from-green-500/20 to-green-500/5'
      };
    } else if ((value >= 95 && value < 98) || (value > 102 && value <= 105)) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        label: 'ACCEPTABLE',
        gradient: 'from-yellow-500/20 to-yellow-500/5'
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'CRITICAL',
        gradient: 'from-red-500/20 to-red-500/5'
      };
    }
  };

  const statusConfig = getStatusConfig(recommended_value);

  // Prepare chart data
  const chartData = [
    { method: 'SMB', value: mb_results.smb, fill: '#64748b' },
    { method: 'AMB', value: mb_results.amb, fill: '#3b82f6' },
    { method: 'RMB', value: mb_results.rmb || 0, fill: mb_results.rmb ? '#8b5cf6' : '#475569' },
    { method: 'LK-IMB', value: mb_results.lk_imb, fill: '#10b981', ci: [mb_results.lk_imb_lower_ci, mb_results.lk_imb_upper_ci] },
    { method: 'CIMB', value: mb_results.cimb, fill: '#06b6d4', ci: [mb_results.cimb_lower_ci, mb_results.cimb_upper_ci] }
  ];

  // Radar chart for method comparison
  const radarData = [
    { metric: 'Accuracy', SMB: 70, AMB: 80, 'LK-IMB': 90, CIMB: 95 },
    { metric: 'Precision', SMB: 65, AMB: 75, 'LK-IMB': 88, CIMB: 92 },
    { metric: 'Complexity', SMB: 95, AMB: 85, 'LK-IMB': 60, CIMB: 50 },
    { metric: 'Regulatory', SMB: 60, AMB: 70, 'LK-IMB': 85, CIMB: 95 },
    { metric: 'Reliability', SMB: 70, AMB: 78, 'LK-IMB': 87, CIMB: 93 }
  ];


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

    const lkScaleMin = 85;
    const lkScaleMax = 115;
    const lkScaleWidth = 160;
    const lkScaleX = 25;

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(lkScaleX, yPos + 20, lkScaleX + lkScaleWidth, yPos + 20);

    for (let i = lkScaleMin; i <= lkScaleMax; i += 5) {
      const x = lkScaleX + ((i - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
      doc.line(x, yPos + 18, x, yPos + 22);
      doc.setFontSize(8);
      doc.text(`${i}`, x, yPos + 28, { align: 'center' });
    }

    const lkAcceptMinX = lkScaleX + ((95 - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    const lkAcceptMaxX = lkScaleX + ((105 - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setFillColor(220, 252, 231);
    doc.rect(lkAcceptMinX, yPos + 10, lkAcceptMaxX - lkAcceptMinX, 20, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(lkAcceptMinX, yPos + 10, lkAcceptMaxX - lkAcceptMinX, 20);

    const lkImbX = lkScaleX + ((mb_results.lk_imb - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setFillColor(22, 163, 74);
    doc.circle(lkImbX, yPos + 20, 3, 'F');

    const lkCiLowerX = lkScaleX + ((mb_results.lk_imb_lower_ci - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    const lkCiUpperX = lkScaleX + ((mb_results.lk_imb_upper_ci - lkScaleMin) / (lkScaleMax - lkScaleMin)) * lkScaleWidth;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(2);
    doc.line(lkCiLowerX, yPos + 20, lkCiUpperX, yPos + 20);
    doc.line(lkCiLowerX, yPos + 17, lkCiLowerX, yPos + 23);
    doc.line(lkCiUpperX, yPos + 17, lkCiUpperX, yPos + 23);

    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text(`LK-IMB: ${mb_results.lk_imb}%`, lkImbX, yPos + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`95% CI: [${mb_results.lk_imb_lower_ci}%, ${mb_results.lk_imb_upper_ci}%]`, 105, yPos + 35, { align: 'center' });

    yPos += 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('LK-IMB Risk Assessment', 20, yPos);

    yPos += 10;

    const lkRiskLevel = mb_results.lk_imb_risk_level;
    const lkRiskColor = lkRiskLevel === 'LOW' ? [16, 185, 129] :
      lkRiskLevel === 'MODERATE' ? [245, 158, 11] : [239, 68, 68];

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

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CIMB Statistical Analysis', 20, yPos);

    yPos += 10;

    const scaleMin = 85;
    const scaleMax = 115;
    const scaleWidth = 160;
    const scaleX = 25;

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(scaleX, yPos + 20, scaleX + scaleWidth, yPos + 20);

    for (let i = scaleMin; i <= scaleMax; i += 5) {
      const x = scaleX + ((i - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
      doc.line(x, yPos + 18, x, yPos + 22);
      doc.setFontSize(8);
      doc.text(`${i}`, x, yPos + 28, { align: 'center' });
    }

    const acceptMinX = scaleX + ((95 - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    const acceptMaxX = scaleX + ((105 - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setFillColor(220, 252, 231);
    doc.rect(acceptMinX, yPos + 10, acceptMaxX - acceptMinX, 20, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(acceptMinX, yPos + 10, acceptMaxX - acceptMinX, 20);

    const cimbX = scaleX + ((mb_results.cimb - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setFillColor(31, 78, 120);
    doc.circle(cimbX, yPos + 20, 3, 'F');

    const ciLowerX = scaleX + ((mb_results.cimb_lower_ci - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    const ciUpperX = scaleX + ((mb_results.cimb_upper_ci - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
    doc.setDrawColor(31, 78, 120);
    doc.setLineWidth(2);
    doc.line(ciLowerX, yPos + 20, ciUpperX, yPos + 20);
    doc.line(ciLowerX, yPos + 17, ciLowerX, yPos + 23);
    doc.line(ciUpperX, yPos + 17, ciUpperX, yPos + 23);

    doc.setFontSize(9);
    doc.setTextColor(31, 78, 120);
    doc.text(`CIMB: ${mb_results.cimb}%`, cimbX, yPos + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`95% CI: [${mb_results.cimb_lower_ci}%, ${mb_results.cimb_upper_ci}%]`, 105, yPos + 35, { align: 'center' });

    yPos += 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CIMB Risk Assessment', 20, yPos);

    yPos += 10;

    const riskLevel = mb_results.cimb_risk_level;
    const riskColor = riskLevel === 'LOW' ? [16, 185, 129] :
      riskLevel === 'MODERATE' ? [245, 158, 11] : [239, 68, 68];

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

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Dual-Method Mass Balance Calculator v2.0 | LK-IMB + CIMB', 105, 285, { align: 'center' });
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });

    const filename = `Mass_Balance_Report_${new Date().toISOString().slice(0, 10)}_${recommended_method}.pdf`;
    doc.save(filename);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Method', 'Value (%)', 'Lower CI', 'Upper CI', 'Risk Level'],
      ['SMB', mb_results.smb, '-', '-', '-'],
      ['AMB', mb_results.amb, '-', '-', '-'],
      ['RMB', mb_results.rmb || 'N/A', '-', '-', '-'],
      ['LK-IMB', mb_results.lk_imb, mb_results.lk_imb_lower_ci, mb_results.lk_imb_upper_ci, mb_results.lk_imb_risk_level],
      ['CIMB', mb_results.cimb, mb_results.cimb_lower_ci, mb_results.cimb_upper_ci, mb_results.cimb_risk_level],
      [],
      ['Correction Factors'],
      ['Lambda', correction_factors.lambda],
      ['Omega', correction_factors.omega],
      ['Stoichiometric', correction_factors.stoichiometric_factor],
      [],
      ['Recommendation'],
      ['Method', recommended_method],
      ['Value', recommended_value],
      ['Status', status]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass_balance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleDownloadExcel = async () => {
    try {
      const data = {
        sample_id: inputs.sample_id,
        analyst_name: inputs.analyst_name,
        stress_type: inputs.stress_type,
        initial_api: inputs.initial_api,
        stressed_api: inputs.stressed_api,
        initial_degradants: inputs.initial_degradants,
        stressed_degradants: inputs.stressed_degradants,
        parent_mw: inputs.parent_mw,
        degradant_mw: inputs.degradant_mw,
        rrf: inputs.rrf
      };

      const response = await axios.post(
        `${API_URL}/excel/generate`,
        data,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${data.sample_id}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to generate Excel report');
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      downloadPDF();
    } else if (exportFormat === 'csv') {
      exportToCSV();
    } else if (exportFormat === 'excel') {
      handleDownloadExcel();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Recommendation Engine Readout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-colors" />

          {/* Export Controls - Top Right of this card */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 text-slate-200 rounded-lg font-medium text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">XLSX</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Download size={16} />
              <span className="text-sm">Export</span>
            </motion.button>
          </div>

          <div className="relative flex flex-col items-start gap-6">
            <div className="flex-1 w-full">
              <div className="mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/10 mt-1">
                    <Target className="text-blue-400" size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase font-display whitespace-nowrap mb-1">Recommended Intelligence</h3>
                    <h2 className="text-2xl font-black text-white tracking-tight font-display uppercase leading-none">
                      {recommended_method} <span className="text-slate-500 font-bold">Method</span>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-4 mb-6">
                <div className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                  {recommended_value.toFixed(2)}<span className="text-2xl text-slate-500 ml-1">%</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} animate-pulse`}>
                  {statusConfig.icon === CheckCircle ? 'OPTIMAL' : statusConfig.icon === AlertTriangle ? 'RE-VALIDATE' : 'INVALID'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence_index}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                    <span className="text-xs font-mono text-blue-400 font-bold">{confidence_index}%</span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Method Integrity</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-tighter">Validated Instrument</span>
                  </div>
                </div>
              </div>

              {/* Status Analysis - Now Inside */}
              <div className={`relative overflow-hidden rounded-xl border ${statusConfig.border} ${statusConfig.bg} backdrop-blur-xl shadow-lg mb-6`}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 ${statusConfig.bg} rounded-lg border ${statusConfig.border}`}>
                      <statusConfig.icon size={16} className={statusConfig.color} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold tracking-wide uppercase" style={{ color: statusConfig.color.replace('text-', '') }}>Status Analysis</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">Quality assessment</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${statusConfig.bg} rounded-md border ${statusConfig.border}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${statusConfig.color}`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {diagnostic_message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <FileText className="text-slate-500" size={18} />
              </div>
              <div>
                <span className="text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase block mb-2">Technical Rationale Log</span>
                <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-6 py-1">
                  "{rationale}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Correction Matrix & Degradation Flux */}
        <div className="w-full space-y-6">
          {/* Correction Matrix */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-6 flex items-center justify-between">
                Correction Matrix
                <Zap size={14} className="text-indigo-400 animate-pulse" />
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Lambda (RRF)', value: correction_factors.lambda, icon: 'λ', color: 'text-blue-400' },
                  { label: 'Omega (MW)', value: correction_factors.omega, icon: 'ω', color: 'text-violet-400' },
                  { label: 'S-Stoichiometry', value: correction_factors.stoichiometric_factor, icon: 'Σ', color: 'text-emerald-400' }
                ].map((factor) => (
                  <div key={factor.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/item">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center font-serif text-base ${factor.color}`}>{factor.icon}</div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{factor.label}</span>
                    </div>
                    <span className="text-lg font-mono font-black text-white">{factor.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Degradation Flux */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Degradation Flux</span>
                <Activity size={14} className="text-emerald-400 animate-pulse" />
              </div>
              <div className="text-4xl font-black text-white mb-4 group-hover:scale-105 transition-transform duration-500 origin-left">
                {degradation_level.toFixed(1)}<span className="text-lg text-slate-500 ml-1">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase">
                <span>Depth Analysis</span>
                <span>{degradation_level > 15 ? 'Critical' : 'Nominal'}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(degradation_level * 2, 100)}%` }}
                  className={`h-full rounded-full bg-gradient-to-r ${degradation_level > 20 ? 'from-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'from-blue-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ML Anomaly Detection Banner */}
      <MLAnomaly prediction={results.ml_prediction} />

      {/* Bayesian Analysis Banner */}
      <BayesianAnalysis results={mb_results} />

      {/* Navigation Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
        {['overview', 'methods', 'diagnostics'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeView === view
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700/50'
              }`}
          >
            {view === 'overview' && <Activity size={18} />}
            {view === 'methods' && <BarChart3 size={18} />}
            {view === 'diagnostics' && <FileText size={18} />}
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Content Area */}
      <motion.div variants={itemVariants} className="min-h-[400px]">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Method Results Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(mb_results).filter(([key]) =>
                ['smb', 'amb', 'rmb', 'lk_imb', 'cimb'].includes(key)
              ).map(([key, value]) => {
                const isRecommended = key === recommended_method.toLowerCase().replace('-', '_');
                const config = getStatusConfig(value || 0);

                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -5 }}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${isRecommended
                      ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                  >
                    {isRecommended && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <span className={`text-[10px] font-black tracking-widest ${isRecommended ? 'text-blue-400' : 'text-slate-500'} uppercase`}>
                          {key.toUpperCase().replace('_', '-')}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')} animate-pulse`} />
                      </div>
                      <div className="flex flex-col gap-1 mt-6 mb-6">
                        <div className="text-3xl font-black text-white font-mono tracking-tighter">
                          {value ? value.toFixed(2) : '0.00'}<span className="text-sm text-slate-500 ml-0.5">%</span>
                        </div>
                        <div className={`text-[9px] font-black tracking-widest uppercase ${config.color}`}>
                          {config.label}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Confidence</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {isRecommended ? 'MAX-RES' : 'NOMINAL'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Hybrid Detection Analysis */}
            {results.hybrid_detection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-slate-900/50 backdrop-blur-xl p-8"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-transparent blur-3xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <Zap className="text-orange-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Hybrid Detection Analysis</h3>
                      <p className="text-sm text-slate-400">Multi-Detector Degradant Coverage</p>
                    </div>
                  </div>

                  {/* Detection Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-2">Detection Method</div>
                      <div className="text-xl font-bold text-orange-400 font-mono">
                        {results.hybrid_detection.detection_sources}
                      </div>
                    </div>
                    <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-2">Coverage</div>
                      <div className="text-xl font-bold text-green-400">
                        {results.hybrid_detection.detection_coverage_pct}%
                      </div>
                    </div>
                    <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-2">Composite RRF</div>
                      <div className="text-xl font-bold text-cyan-400">
                        {results.hybrid_detection.composite_rrf}
                      </div>
                    </div>
                  </div>

                  {/* Method Completeness */}
                  <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4">Method Completeness: {results.hybrid_detection.method_completeness.completeness_pct}%</h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: 'Chromophores',
                          value: results.hybrid_detection.method_completeness.chromophore_coverage,
                          icon: '🌈'
                        },
                        {
                          label: 'Non-UV Active',
                          value: results.hybrid_detection.method_completeness.non_uv_coverage,
                          icon: '🔍'
                        },
                        {
                          label: 'Volatiles',
                          value: results.hybrid_detection.method_completeness.volatile_coverage,
                          icon: '💨'
                        },
                        {
                          label: 'Structure ID',
                          value: results.hybrid_detection.method_completeness.structural_confirmation,
                          icon: '🧬'
                        }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <div className="text-xs text-slate-500">{item.label}</div>
                            <div className={`text-sm font-bold ${item.value ? 'text-green-400' : 'text-red-400'}`}>
                              {item.value ? '✓ Covered' : '✗ Missing'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* UV-Silent Analysis */}
                  {results.hybrid_detection.uv_silent_analysis && results.hybrid_detection.uv_silent_analysis.uv_silent_detected && (
                    <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <h4 className="text-md font-bold text-yellow-400 mb-2">UV-Silent Degradants Detected</h4>
                          <p className="text-sm text-slate-300 mb-2">
                            {results.hybrid_detection.uv_silent_analysis.uv_silent_degradants_pct}% of degradants lack UV chromophores
                          </p>
                          <p className="text-xs text-slate-400">
                            Impact: {results.hybrid_detection.uv_silent_analysis.impact_on_mb}
                          </p>
                          <p className="text-xs text-yellow-300 mt-2 font-semibold">
                            ➜ {results.hybrid_detection.uv_silent_analysis.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Volatile Loss Analysis */}
                  {results.hybrid_detection.volatile_analysis && results.hybrid_detection.volatile_analysis.volatile_loss_detected && (
                    <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-orange-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <h4 className="text-md font-bold text-orange-400 mb-2">Volatile Loss Detected</h4>
                          <p className="text-sm text-slate-300 mb-2">
                            {results.hybrid_detection.volatile_analysis.volatile_loss_pct}% volatile degradation products
                          </p>
                          <p className="text-xs text-slate-400">
                            Severity: {results.hybrid_detection.volatile_analysis.severity}
                          </p>
                          <p className="text-xs text-orange-300 mt-2 font-semibold">
                            ➜ {results.hybrid_detection.volatile_analysis.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.hybrid_detection.method_completeness.recommendations &&
                    results.hybrid_detection.method_completeness.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-300">Recommendations:</h4>
                        {results.hybrid_detection.method_completeness.recommendations.map((rec, idx) => {
                          const priorityColors = {
                            'HIGH': 'red',
                            'MODERATE': 'yellow',
                            'INFO': 'blue'
                          };
                          const color = priorityColors[rec.priority] || 'slate';

                          return (
                            <div key={idx} className={`p-4 bg-${color}-500/10 border border-${color}-500/20 rounded-lg`}>
                              <div className="flex items-start gap-3">
                                <span className={`px-2 py-1 text-xs font-bold rounded bg-${color}-500/20 text-${color}-400`}>
                                  {rec.priority}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-white font-medium mb-1">{rec.message}</p>
                                  <p className="text-xs text-slate-400">{rec.benefit}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </motion.div>
            )}

            {/* Statistical Analysis Sections */}
            {
              mb_results.lk_imb && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-900/20 to-slate-900/50 backdrop-blur-xl p-8"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-transparent blur-3xl" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <Activity className="text-green-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">LK-IMB Statistical Analysis</h3>
                        <p className="text-sm text-slate-400">Lukulay-Körner Integrated Mass Balance with 95% CI</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                        <div className="text-sm text-slate-400 mb-2">Lower CI (95%)</div>
                        <div className="text-2xl font-bold text-green-400">{mb_results.lk_imb_lower_ci}%</div>
                      </div>
                      <div className="p-5 bg-green-500/10 rounded-xl border border-green-500/30 text-center ring-2 ring-green-500/20">
                        <div className="text-sm text-slate-400 mb-2">Point Estimate</div>
                        <div className="text-3xl font-bold text-green-400">{mb_results.lk_imb}%</div>
                      </div>
                      <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                        <div className="text-sm text-slate-400 mb-2">Upper CI (95%)</div>
                        <div className="text-2xl font-bold text-green-400">{mb_results.lk_imb_upper_ci}%</div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Risk Assessment:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${mb_results.lk_imb_risk_level === 'LOW' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          mb_results.lk_imb_risk_level === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {mb_results.lk_imb_risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            }

            {
              mb_results.cimb && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/20 to-slate-900/50 backdrop-blur-xl p-8"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                        <Zap className="text-cyan-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">CIMB Statistical Analysis</h3>
                        <p className="text-sm text-slate-400">Corrected Integrated Mass Balance with Pathway Factors</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                        <div className="text-sm text-slate-400 mb-2">Lower CI (95%)</div>
                        <div className="text-2xl font-bold text-cyan-400">{mb_results.cimb_lower_ci}%</div>
                      </div>
                      <div className="p-5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 text-center ring-2 ring-cyan-500/20">
                        <div className="text-sm text-slate-400 mb-2">Point Estimate</div>
                        <div className="text-3xl font-bold text-cyan-400">{mb_results.cimb}%</div>
                      </div>
                      <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                        <div className="text-sm text-slate-400 mb-2">Upper CI (95%)</div>
                        <div className="text-2xl font-bold text-cyan-400">{mb_results.cimb_upper_ci}%</div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Risk Assessment:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${mb_results.cimb_risk_level === 'LOW' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          mb_results.cimb_risk_level === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {mb_results.cimb_risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            }

            {/* Interactive Visualizations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-400" size={20} />
                Method Comparison Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart with CI */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4">Mass Balance Results</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis
                        dataKey="method"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <YAxis
                        domain={[80, 110]}
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        label={{ value: 'Mass Balance (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        y={95}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{ value: "95%", position: "right", fill: "#10b981" }}
                      />
                      <ReferenceLine
                        y={105}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{ value: "105%", position: "right", fill: "#10b981" }}
                      />
                      <Bar dataKey="value" fill="url(#colorValue)" radius={[8, 8, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4">Performance Profile</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar name="LK-IMB" dataKey="LK-IMB" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Radar name="CIMB" dataKey="CIMB" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeView === 'methods' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Correction Factors */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-violet-400" size={20} />
                Correction Factors Applied
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Lambda (λ)', value: correction_factors.lambda, desc: 'RRF Correction', color: 'blue' },
                  { label: 'Omega (ω)', value: correction_factors.omega, desc: 'MW Correction', color: 'violet' },
                  { label: 'Stoichiometric (S)', value: correction_factors.stoichiometric_factor, desc: 'Pathway Factor', color: 'cyan' }
                ].map((factor, idx) => (
                  <div key={idx} className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                    <div className="text-sm text-slate-400 mb-2">{factor.label}</div>
                    <div className="text-3xl font-bold text-white mb-1">{factor.value}</div>
                    <div className="text-xs text-slate-500">{factor.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Method Table */}
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Result</th>
                    <th className="px-6 py-4">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(mb_results).filter(([k]) => ['smb', 'amb', 'lk_imb', 'cimb'].includes(k)).map(([k, v]) => (
                    <tr key={k} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium uppercase">{k.replace('_', '-')}</td>
                      <td className="px-6 py-4 text-slate-300">{v}%</td>
                      <td className="px-6 py-4 text-slate-400">{getStatusConfig(v).label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === 'diagnostics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="text-orange-400" size={20} />
                Diagnostic Assessment
              </h3>
              <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 mb-6">
                <p className="text-slate-300 leading-relaxed">{diagnostic_message}</p>
              </div>
              <div className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Scientific Rationale</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{rationale}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div >
  );
}

export default Results;