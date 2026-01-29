# 🧬 TRIAL-PULSE

### Intelligent Mass Balance & Stability Analysis Platform for Pharmaceutical Quality Monitoring

---

## 📌 Overview

**TRIAL-PULSE** is an intelligent pharmaceutical analytics platform designed to automate **mass balance calculations**, improve **drug stability analysis workflows**, and generate **regulatory-ready reports** in real time.

The platform eliminates manual spreadsheet dependency by providing a **full-stack digital solution** that integrates:

* Automated Mass Balance Calculations
* Degradation & Stability Tracking
* Molecular Weight & RRF Adjusted Corrections
* Instant PDF & Excel Report Generation
* Persistent Data Storage

Built during a hackathon environment, TRIAL-PULSE demonstrates how digital automation can improve **pharma quality control**, **stability studies**, and **regulatory documentation workflows**.

---

## 🚀 Key Features

### 🧮 Automated Mass Balance Engine

* API purity tracking (Initial vs Stressed)
* Degradant contribution analysis
* Molecular weight correction
* Relative Response Factor (RRF) normalization

---

### 📊 Smart Report Generation

* Generates downloadable **PDF regulatory reports**
* Excel compatible output
* Structured summary for audit readiness

---

### 🌐 Full Stack Architecture

* Modern Web Frontend
* Scalable Backend APIs
* Python Scientific Processing Layer
* SQLite Data Persistence

---

### ⚡ Real Time Processing

* Instant calculation on input submission
* Live results dashboard
* One-click report export

---

## 🏗️ System Architecture

```
Frontend (Vite / JavaScript)
        ↓
Backend API (Node.js)
        ↓
Scientific Engine (Python + XlsxWriter)
        ↓
Database (SQLite)
```

---

## 📂 Project Structure

```
backend/
   mass_balance.db
   server logic
   API endpoints

frontend/
   UI components
   form handling
   API integration

app.py
   Scientific calculation logic
   Excel report generation

Mass_Balance_Calculator_Pro.xlsx
   Reference calculation model

Mass_Balance_Report_YYYY-MM-DD.pdf
   Sample generated report

README.md
   Documentation
```

---

## 🧪 Scientific Calculation Scope

The platform calculates:

* % API Loss
* % Degradant Formation
* Molecular Weight Adjusted Mass Contribution
* RRF Adjusted Corrected Purity
* Final Mass Balance %

---

## 📥 Input Parameters

| Parameter                  | Description                |
| -------------------------- | -------------------------- |
| Initial API %              | Starting purity            |
| Stressed API %             | Post stress purity         |
| Initial Degradants %       | Baseline impurity          |
| Stressed Degradants %      | Post stress impurity       |
| Parent Molecular Weight    | API MW                     |
| Degradant Molecular Weight | Degradant MW               |
| Relative Response Factor   | Chromatographic correction |

---

## 📤 Output

* Final Mass Balance %
* Corrected Purity Metrics
* Degradation Impact Summary
* Downloadable PDF Report
* Excel Calculation Sheet

---

## 🛠️ Technology Stack

### Frontend

* JavaScript
* Vite
* HTML5
* CSS3

### Backend

* Node.js
* Express (if used)
* SQLite

### Scientific Layer

* Python
* XlsxWriter

---



## 🧪 Sample Test Data

| Parameter           | Sample Value |
| ------------------- | ------------ |
| Initial API         | 98%          |
| Stressed API        | 82.5%        |
| Initial Degradants  | 0.5%         |
| Stressed Degradants | 4.9%         |
| Parent MW           | 500          |
| Degradant MW        | 250          |
| RRF                 | 0.8          |

---

## 📈 Use Cases

✔ Pharmaceutical Stability Studies
✔ Quality Control Labs
✔ Regulatory Documentation Preparation
✔ Analytical Method Validation
✔ Degradation Pathway Monitoring

---

## 🏆 Innovation Highlights

* Eliminates manual Excel dependency
* Reduces human calculation error
* Enables audit-ready report generation
* Bridges scientific computation with modern UI
* Scalable for enterprise pharma environments

---

## 🔮 Future Roadmap

* Cloud Deployment
* AI-Based Degradation Prediction
* Batch Upload Analysis
* LIMS Integration
* Regulatory Format Auto-Compliance
* Multi-Compound Analysis

---

## 🤝 Contribution

Contributions, feature requests, and improvements are welcome.

---

## 📜 License

MIT License

---

## 👨‍💻 Team / Author

**Anshuman Kumar**
Full Stack + Scientific Computation Development

---

## 💡 Hackathon Vision Statement

TRIAL-PULSE aims to accelerate pharmaceutical quality analytics by combining scientific rigor with digital automation — enabling faster, more reliable, and scalable stability intelligence for modern drug development pipelines.

---
