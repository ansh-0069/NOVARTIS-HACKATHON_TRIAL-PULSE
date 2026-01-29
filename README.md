# Mass Balance Calculator - Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

## Installation & Setup


pip install xlsxwriter
python app.py


### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Start Backend Server
```bash
cd ../backend
npm run dev
```
The backend will run on `http://localhost:5000`

### 4. Start Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## Testing the Application

1. Open browser to `http://localhost:5173`
2. Use the default test values or enter custom data
3. Click "Calculate Mass Balance"
4. View results and download PDF report

## Default Test Values
- Initial API: 98%
- Stressed API: 82.5%
- Initial Degradants: 0.5%
- Stressed Degradants: 4.9%
- Parent MW: 500
- Degradant MW: 250
- RRF: 0.8

## Troubleshooting

**Port already in use:**
- Backend: Change port in `backend/server.js` (line 5)
- Frontend: Change port in `frontend/vite.config.js`

**Dependencies not installing:**
```bash
npm cache clean --force
npm install
```

**Database errors:**
- Delete `backend/mass_balance.db` and restart backend