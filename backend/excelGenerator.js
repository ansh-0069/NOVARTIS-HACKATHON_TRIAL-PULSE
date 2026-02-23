/**
 * Excel Report Generator - Integrates with Python
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function generateExcelReport(options = {}) {
  return new Promise((resolve, reject) => {
    const { outputPath = `Report_${Date.now()}.xlsx` } = options;

    const scriptPath = path.join(__dirname, '..', 'excel-service', 'excel.py');
    const dbPath = path.join(__dirname, 'mass_balance.db');
    const outputDir = path.join(__dirname, 'reports');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fullOutputPath = path.join(outputDir, outputPath);
    const args = [scriptPath, dbPath, fullOutputPath];

    console.log('📊 Generating Excel...');

    const python = spawn('python', args);
    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => stdout += data.toString());
    python.stderr.on('data', (data) => stderr += data.toString());

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python failed:', stderr);
        reject({ error: 'Python script failed', stderr, code });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.status === 'success') {
          console.log('✅ Excel generated!');
          resolve({ success: true, filePath: fullOutputPath });
        } else {
          reject({ error: result.message });
        }
      } catch (e) {
        reject({ error: 'Parse failed', stdout, stderr });
      }
    });

    python.on('error', (err) => {
      reject({ error: 'Python start failed', details: err.message });
    });
  });
}

async function generateReportFromCalculation(db, calcId) {
  return generateExcelReport({
    outputPath: `Calc_${calcId.substring(0, 8)}_${Date.now()}.xlsx`
  });
}

async function generateHistoryReport(db, limit = 100) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'excel-service', 'excel.py');
    const outputDir = path.join(__dirname, 'reports');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = `Calculation_History_${Date.now()}.xlsx`;
    const fullOutputPath = path.join(outputDir, outputPath);

    const args = [scriptPath, '--history-only'];

    console.log('📊 Generating history-only Excel...');

    const python = spawn('python', args);
    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => stdout += data.toString());
    python.stderr.on('data', (data) => stderr += data.toString());

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python failed:', stderr);
        reject({ error: 'Python script failed', stderr, code });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.status === 'success') {
          console.log('✅ History Excel generated!');
          resolve({ success: true, filePath: result.file });
        } else {
          reject({ error: result.message });
        }
      } catch (e) {
        reject({ error: 'Parse failed', stdout, stderr });
      }
    });

    python.on('error', (err) => {
      reject({ error: 'Python start failed', details: err.message });
    });
  });
}

module.exports = {
  generateExcelReport,
  generateReportFromCalculation,
  generateHistoryReport
};