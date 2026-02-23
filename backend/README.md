# Backend - Mass Balance AI

## 🔧 Node.js Backend Server

This is the backend server for Mass Balance AI, built with Node.js, Express, and SQLite.

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will be available at `http://localhost:5000`

---

## 📁 Project Structure

```
backend/
├── server.js           # Express server and API endpoints
├── mass_balance.db     # SQLite database
├── inspect_db.py       # Database inspection utility
└── package.json        # Dependencies and scripts
```

---

## 🔌 API Endpoints

### Health Check

```http
GET /
```

Returns server status:
```json
{
  "status": "running",
  "message": "Mass Balance Calculator API is running"
}
```

### Calculate Mass Balance

```http
POST /api/calculate
```

**Request Body:**
```json
{
  "sampleId": "SAMPLE-001",
  "initialAPI": 99.5,
  "stressedAPI": 95.2,
  "stressedDegradants": 3.8,
  "initialDegradants": 0.3,
  "method": "LK-IMB",
  "lambda": 1.0,
  "omega": 0.95,
  "stoichiometric": 1.0
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "sampleId": "SAMPLE-001",
  "result": 98.7,
  "confidenceInterval": {
    "lower": 97.5,
    "upper": 99.9
  },
  "riskLevel": "LOW",
  "method": "LK-IMB",
  "timestamp": "2026-02-13T12:00:00.000Z"
}
```

### Get All Calculations

```http
GET /api/calculations
```

Returns array of all stored calculations.

### Get Calculation by ID

```http
GET /api/calculations/:id
```

Returns a specific calculation by UUID.

### Delete Calculation

```http
DELETE /api/calculations/:id
```

Deletes a calculation by UUID.

### Get Analytics

```http
GET /api/analytics
```

Returns aggregated analytics:
```json
{
  "totalCalculations": 150,
  "methodDistribution": {
    "LK-IMB": 60,
    "CIMB": 45,
    "SMB": 25,
    "AMB": 15,
    "RMB": 5
  },
  "riskDistribution": {
    "LOW": 120,
    "MODERATE": 25,
    "HIGH": 5
  },
  "averageResult": 99.2,
  "trends": [...]
}
```

---

## 🧪 Calculation Methods

### 1. Simple Mass Balance (SMB)
```
Result = Stressed API + Stressed Degradants
```

### 2. Adjusted Mass Balance (AMB)
```
Result = (Stressed API + Stressed Degradants) / (Initial API + Initial Degradants) × 100
```

### 3. Ratio Mass Balance (RMB)
```
Result = ΔDegradants / ΔAPI × 100
where:
  ΔDegradants = Stressed Degradants - Initial Degradants
  ΔAPI = Initial API - Stressed API
```

### 4. Lambda-Kappa Improved Mass Balance (LK-IMB)
```
Result = (Stressed API + Stressed Degradants × λ × ω) / Initial API × 100
where:
  λ = Lambda correction factor
  ω = Omega correction factor
```

### 5. Corrected Improved Mass Balance (CIMB)
```
Result = (Stressed API + Stressed Degradants × λ × S) / Initial API × 100
where:
  λ = Lambda correction factor
  S = Stoichiometric factor
```

---

## 📊 Statistical Analysis

### Confidence Intervals

95% confidence intervals calculated using t-distribution (df=2):

```javascript
const tValue = 4.303; // t-distribution, df=2, 95% CI
const uncertainty = Math.sqrt(variance_api + variance_deg);
const margin = tValue * uncertainty;

const confidenceInterval = {
  lower: result - margin,
  upper: result + margin
};
```

### Risk Classification

```javascript
if (result >= 98 && result <= 102) {
  riskLevel = "LOW";
} else if ((result >= 95 && result < 98) || (result > 102 && result <= 105)) {
  riskLevel = "MODERATE";
} else {
  riskLevel = "HIGH";
}
```

---

## 💾 Database Schema

### calculations Table

```sql
CREATE TABLE calculations (
  id TEXT PRIMARY KEY,
  sampleId TEXT NOT NULL,
  initialAPI REAL NOT NULL,
  stressedAPI REAL NOT NULL,
  stressedDegradants REAL NOT NULL,
  initialDegradants REAL NOT NULL,
  method TEXT NOT NULL,
  lambda REAL,
  omega REAL,
  stoichiometric REAL,
  result REAL NOT NULL,
  confidenceIntervalLower REAL,
  confidenceIntervalUpper REAL,
  riskLevel TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Configuration

### Port Configuration

Default port: `5000`

To change, modify `server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

### Database Location

Default: `./mass_balance.db`

The database is automatically created if it doesn't exist.

### CORS Configuration

Currently allows all origins for development:
```javascript
app.use(cors());
```

For production, configure specific origins:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "sqlite3": "^5.1.6",
  "uuid": "^9.0.0",
  "cors": "^2.8.5"
}
```

---

## 🛠️ Database Utilities

### Inspect Database

Use the included Python script to inspect the database:

```bash
python inspect_db.py
```

This will display:
- Total number of calculations
- Recent calculations
- Method distribution
- Risk level distribution

---

## 🐛 Troubleshooting

### Port 5000 Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in server.js
```

### Database Locked Error

Ensure no other processes are accessing `mass_balance.db`:
```bash
# Close all connections and restart server
```

### CORS Errors

If frontend can't connect, verify CORS is enabled:
```javascript
app.use(cors());
```

### SQLite Errors

Reinstall sqlite3:
```bash
npm uninstall sqlite3
npm install sqlite3 --build-from-source
```

---

## 📚 Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
```

---

## 🔒 Security Considerations

For production deployment:

1. **Environment Variables:** Use `.env` for sensitive configuration
2. **Input Validation:** Add request validation middleware
3. **Rate Limiting:** Implement rate limiting for API endpoints
4. **Authentication:** Add JWT or session-based authentication
5. **HTTPS:** Use HTTPS in production
6. **SQL Injection:** Use parameterized queries (already implemented)

---

## 🎓 Learning Resources

- [Express Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📄 API Testing

### Using cURL

```bash
# Health check
curl http://localhost:5000/

# Calculate mass balance
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "sampleId": "TEST-001",
    "initialAPI": 99.5,
    "stressedAPI": 95.2,
    "stressedDegradants": 3.8,
    "initialDegradants": 0.3,
    "method": "LK-IMB",
    "lambda": 1.0,
    "omega": 0.95
  }'

# Get all calculations
curl http://localhost:5000/api/calculations

# Get analytics
curl http://localhost:5000/api/analytics
```

---

**Backend built with Node.js, Express, and SQLite** 🔧
