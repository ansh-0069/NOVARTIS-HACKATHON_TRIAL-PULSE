# 🧬 Mass Balance Calculator

### Intelligent Mass Balance & Stability Analysis Platform for Pharmaceutical Quality Monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)

---

## 📌 Overview

**Mass Balance Calculator** is an intelligent pharmaceutical analytics platform designed to automate **mass balance calculations**, improve **drug stability analysis workflows**, and generate **regulatory-ready reports** in real time.

The platform eliminates manual spreadsheet dependency by providing a **full-stack digital solution** that integrates:

* **Dual Statistical Methods**: LK-IMB and CIMB with 95% Confidence Intervals
* **Automated Mass Balance Calculations** (SMB, AMB, RMB, LK-IMB, CIMB)
* **Risk-Based Assessment** (LOW/MODERATE/HIGH)
* **Degradation & Stability Tracking**
* **Molecular Weight & RRF Adjusted Corrections**
* **Instant PDF & Excel Report Generation**
* **Persistent Data Storage with History**

Built for pharmaceutical quality control, Mass Balance Calculator demonstrates how digital automation can improve **pharma QC**, **stability studies**, and **regulatory documentation workflows**.

---

## 🎬 Demo

Watch the complete demonstration of Mass Balance Calculator in action:

[**View Project Demo**](https://drive.google.com/file/d/1DUwHV2xMkMosHj3Oc-4XkVHJNJX5nsbF/view?usp=sharing)

---

## 🚀 Key Features

### 🧮 Advanced Mass Balance Methods

* **SMB** (Simple Mass Balance) - Basic uncorrected calculation
* **AMB** (Absolute Mass Balance) - Purity normalized
* **RMB** (Relative Mass Balance) - Delta ratio based
* **LK-IMB** (Lukulay-Körner Integrated Mass Balance) - Lambda + Omega corrections with **95% CI**
* **CIMB** (Corrected Integrated Mass Balance) - Stoichiometric pathway corrections with **95% CI**

### 📊 Statistical Analysis & Risk Assessment

* **95% Confidence Intervals** for both LK-IMB and CIMB methods
* **t-Distribution** based uncertainty quantification
* **Risk Level Classification**:
  - 🟢 **LOW** (98-102%): Excellent mass balance
  - 🟡 **MODERATE** (95-98% or 102-105%): Acceptable with justification
  - 🔴 **HIGH** (<95% or >105%): Investigation required

### 📈 Smart Report Generation

* **PDF Reports** with:

  - Executive summary
  - LK-IMB statistical analysis with confidence intervals
  - CIMB statistical analysis with confidence intervals
  - Method comparison charts
  - Risk assessment visualization
  - ICH Q1A(R2) compliance indicators
* **Excel Workbooks** with:

  - Interactive data entry sheet
  - Automated calculations engine
  - LK-IMB confidence intervals & risk levels
  - CIMB confidence intervals & risk levels
  - Diagnostic report with conditional formatting
  - Trend tracking charts
  - Method comparison matrix

### 🌐 Full Stack Architecture

* **Modern React Frontend** with Vite
* **Scalable Node.js Backend** with Express
* **Python Scientific Processing** with XlsxWriter
* **SQLite Database** for persistent storage
* **RESTful API** design

### ⚡ Real-Time Processing

* Instant calculation on input submission
* Live results dashboard with interactive charts
* One-click PDF/Excel export
* Calculation history with search and filter

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (React + Vite)                 │
│  - Input Forms                                  │
│  - Results Dashboard                            │
│  - PDF Generation (jsPDF)                       │
│  - Charts (Recharts)                            │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST API
                 ↓
┌─────────────────────────────────────────────────┐
│      Backend API (Node.js + Express)            │
│  - Mass Balance Calculations                    │
│  - Statistical Analysis (LK-IMB & CIMB)         │
│  - Confidence Intervals (t-distribution)        │
│  - Risk Assessment Logic                        │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         Database (SQLite)                       │
│  - Calculation History                          │
│  - LK-IMB & CIMB Statistical Data               │
│  - User Metadata                                │
└─────────────────────────────────────────────────┘

         Python Script (app.py)
              ↓
    Excel Report Generation
    (Mass_Balance_Calculator.xlsx)
```

---

## 📂 Project Structure

```
Mass-Balance-Calculator/
│
├── backend/
│   ├── server.js                    # Express API server
│   ├── mass_balance.db              # SQLite database
│   ├── package.json                 # Backend dependencies
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputForm.jsx        # Data entry form
│   │   │   └── Results.jsx          # Results display with charts
│   │   ├── App.jsx                  # Main application
│   │   └── main.jsx                 # Entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   └── node_modules/
│
├── app.py                           # Excel report generator
├── Mass_Balance_Calculator.xlsx     # Generated Excel workbook
├── README.md                        # This file
└── package.json                     # Root package.json (if any)
```

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/)
- **npm** (comes with Node.js)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Mass-Balance-Calculator
```

#### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Required packages:

- express
- cors
- body-parser
- sqlite3
- uuid

#### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Required packages:

- react
- vite
- axios
- recharts
- lucide-react
- jspdf

#### 4. Install Python Dependencies

```bash
cd ..
pip install xlsxwriter
```

### Running the Application

#### Option 1: Run Both Servers Separately

**Terminal 1 - Backend Server:**

```bash
cd backend
npm run dev
```

Backend will start on: `http://localhost:5000`

**Terminal 2 - Frontend Server:**

```bash
cd frontend
npm run dev
```

Frontend will start on: `http://localhost:5173`

#### Option 2: Generate Excel Report

```bash
python app.py
```

This generates `Mass_Balance_Calculator.xlsx` with sample data.

### Accessing the Application

1. Open your browser and navigate to: `http://localhost:5173`
2. Enter your experimental data in the input form
3. Click "Calculate Mass Balance"
4. View results with statistical analysis
5. Download PDF or Excel reports

---

## 🧪 Scientific Calculation Methods

### 1. Simple Mass Balance (SMB)

```
SMB = Stressed API + Stressed Degradants
```

### 2. Absolute Mass Balance (AMB)

```
AMB = (Stressed API + Stressed Degradants) / (Initial API + Initial Degradants) × 100
```

### 3. Relative Mass Balance (RMB)

```
RMB = (ΔDegradants / ΔAPI) × 100
```

### 4. LK-IMB (Lukulay-Körner Integrated Mass Balance)

```
LK-IMB = (Stressed API + Corrected Degradants) / Initial API × 100

Where:
- Corrected Degradants = Stressed Degradants × λ × ω
- λ (Lambda) = 1 / RRF (Response Factor Correction)
- ω (Omega) = Parent MW / Degradant MW (Molecular Weight Correction)

Statistical Analysis:
- 95% CI = LK-IMB ± (t-critical × combined standard deviation)
- Risk Level: LOW (98-102%), MODERATE (95-98% or 102-105%), HIGH (<95% or >105%)
```

### 5. CIMB (Corrected Integrated Mass Balance)

```
CIMB = (Stressed API + Stoichiometrically Corrected Degradants) / Initial API × 100

Where:
- Corrected Degradants = Stressed Degradants × λ × S
- S (Stoichiometric Factor) varies by stress type:
  * Acid/Base: (Parent MW + 18) / Degradant MW
  * Oxidative: (Parent MW + 16) / Degradant MW
  * Thermal/Photolytic: ω

Statistical Analysis:
- 95% CI = CIMB ± (t-critical × combined standard deviation)
- Risk Level: LOW (98-102%), MODERATE (95-98% or 102-105%), HIGH (<95% or >105%)
```

---

## 📥 Input Parameters

| Parameter                         | Description                   | Example                                    |
| --------------------------------- | ----------------------------- | ------------------------------------------ |
| **Initial API Assay (%)**   | Starting purity before stress | 98.00                                      |
| **Stressed API Assay (%)**  | Purity after stress testing   | 82.50                                      |
| **Initial Degradants (%)**  | Baseline impurity level       | 0.50                                       |
| **Stressed Degradants (%)** | Impurity after stress         | 4.90                                       |
| **Parent MW (g/mol)**       | Molecular weight of API       | 500.00                                     |
| **Degradant MW (g/mol)**    | Molecular weight of degradant | 250.00                                     |
| **RRF**                     | Relative Response Factor      | 0.80                                       |
| **Stress Condition**        | Type of stress applied        | Base, Acid, Oxidative, Thermal, Photolytic |
| **Sample ID**               | Unique sample identifier      | VAL-2026-001                               |
| **Analyst Name**            | Person performing analysis    | A. Singla                                  |

---

## 📤 Output & Reports

### Web Dashboard Output

- **All Method Results**: SMB, AMB, RMB, LK-IMB, CIMB
- **LK-IMB Statistical Analysis**:
  - Point Estimate
  - 95% Confidence Interval (Lower & Upper)
  - Risk Level with color coding
- **CIMB Statistical Analysis**:
  - Point Estimate
  - 95% Confidence Interval (Lower & Upper)
  - Risk Level with color coding
- **Interactive Charts**: Mass balance comparison with reference lines
- **Correction Factors**: λ, ω, S values
- **Recommended Method**: Based on degradation level
- **Diagnostic Messages**: ICH Q1A(R2) compliance indicators

### PDF Report Contents

1. **Cover Page**: Title, status badge, metadata
2. **Executive Summary**: Key findings, risk levels, anomaly detection
3. **LK-IMB Statistical Analysis**: CI visualization, risk assessment
4. **CIMB Statistical Analysis**: CI visualization, risk assessment
5. **Method Comparison**: All results with correction factors
6. **Diagnostic Assessment**: Recommendations and compliance notes

### Excel Workbook Sheets

1. **Data Entry**: Input form with instructions
2. **Calculations**: Hidden engine with all formulas
3. **Diagnostic Report**:
   - All method results
   - LK-IMB 95% CI with risk level
   - CIMB 95% CI with risk level
   - Final status with conditional formatting
4. **Trend Tracking**: Stability trend charts
5. **Method Comparison**: LK-IMB vs CIMB feature matrix

---

## 🛠️ Technology Stack

### Frontend

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **jsPDF** - PDF generation
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite3** - Database
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique ID generation

### Scientific Layer

- **Python 3.8+**
- **XlsxWriter** - Excel file generation

---

## 🧪 Sample Test Data

Use this data to test the application:

| Parameter           | Value        |
| ------------------- | ------------ |
| Initial API         | 98.00%       |
| Stressed API        | 82.50%       |
| Initial Degradants  | 0.50%        |
| Stressed Degradants | 4.90%        |
| Parent MW           | 500.00 g/mol |
| Degradant MW        | 250.00 g/mol |
| RRF                 | 0.80         |
| Stress Condition    | Base         |
| Sample ID           | VAL-2026-001 |
| Analyst Name        | A. Singla    |

**Expected Results:**

- LK-IMB: ~97.4% (Risk: MODERATE)
- CIMB: ~98.8% (Risk: LOW)
- Recommended Method: CIMB

---

## 📈 Use Cases

✅ **Pharmaceutical Stability Studies** - ICH Q1A(R2) compliant analysis
✅ **Quality Control Labs** - Routine mass balance verification
✅ **Regulatory Documentation** - Audit-ready PDF reports
✅ **Analytical Method Validation** - Statistical confidence intervals
✅ **Degradation Pathway Monitoring** - Trend tracking over time
✅ **Risk-Based Decision Making** - Automated risk level classification

---

## 🎯 API Endpoints

### Calculate Mass Balance

```
POST /api/calculate
Content-Type: application/json

Request Body:
{
  "initial_api": 98.00,
  "stressed_api": 82.50,
  "initial_degradants": 0.50,
  "stressed_degradants": 4.90,
  "parent_mw": 500.00,
  "degradant_mw": 250.00,
  "rrf": 0.80,
  "stress_type": "Base",
  "sample_id": "VAL-2026-001",
  "analyst_name": "A. Singla"
}

Response:
{
  "calculation_id": "uuid",
  "timestamp": "ISO-8601",
  "results": {
    "smb": 87.40,
    "amb": 88.78,
    "rmb": 28.39,
    "lk_imb": 97.40,
    "lk_imb_lower_ci": 92.40,
    "lk_imb_upper_ci": 102.40,
    "lk_imb_risk_level": "MODERATE",
    "cimb": 98.80,
    "cimb_lower_ci": 93.80,
    "cimb_upper_ci": 103.80,
    "cimb_risk_level": "LOW"
  },
  "correction_factors": {...},
  "recommended_method": "CIMB",
  "status": "PASS"
}
```

### Save Calculation

```
POST /api/save
```

### Get History

```
GET /api/history
```

### Get Specific Calculation

```
GET /api/calculation/:id
```

### Delete Calculation

```
DELETE /api/calculation/:id
```

---

## 🏆 Innovation Highlights

✨ **Dual Statistical Methods** - Both LK-IMB and CIMB with confidence intervals
✨ **Risk-Based Assessment** - Automated LOW/MODERATE/HIGH classification
✨ **Eliminates Manual Excel** - Full digital workflow
✨ **Reduces Human Error** - Automated calculations with validation
✨ **Audit-Ready Reports** - PDF and Excel with statistical rigor
✨ **Modern UI/UX** - Intuitive interface with real-time feedback
✨ **Scalable Architecture** - Ready for enterprise deployment

---

## 🔮 Future Roadmap

- [ ] Cloud Deployment (AWS/Azure)
- [ ] AI-Based Degradation Prediction
- [ ] Batch Upload Analysis (CSV/Excel import)
- [ ] LIMS Integration
- [ ] Multi-Compound Analysis
- [ ] Advanced Statistical Models (Bootstrap, Monte Carlo)
- [ ] User Authentication & Role Management
- [ ] Regulatory Format Auto-Compliance (FDA, EMA)
- [ ] Real-time Collaboration Features

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <process_id> /F

# Restart backend
cd backend
npm run dev
```

### Frontend won't start

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database errors

```bash
# Delete and recreate database
cd backend
rm mass_balance.db
# Restart server (will auto-create new DB)
npm run dev
```

### Python Excel generation fails

```bash
# Reinstall xlsxwriter
pip uninstall xlsxwriter
pip install xlsxwriter

# Run script
python app.py
```

---

## 🤝 Contributing

Contributions, feature requests, and improvements are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Kumar Anshuman**

- Full Stack Development
- Scientific Computation
- Pharmaceutical Analytics

---

## 🙏 Acknowledgments

- ICH Q1A(R2) Guidelines for Stability Testing
- Lukulay-Körner Method for Integrated Mass Balance
- Pharmaceutical Quality Control Best Practices

---

## 💡 Hackathon Vision Statement

Mass Balance Calculator aims to accelerate pharmaceutical quality analytics by combining scientific rigor with digital automation — enabling faster, more reliable, and scalable stability intelligence for modern drug development pipelines.

**Built with ❤️ for the pharmaceutical community**

---

## 📞 Support

For questions, issues, or feature requests, please open an issue on the repository.

---

**Last Updated:** January 2026
**Version:** 2.0 (LK-IMB & CIMB Statistical Analysis)
