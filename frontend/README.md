# Frontend - Mass Balance

## 🎨 React Frontend Application

This is the frontend application for Mass Balance, built with React, Vite, and Tailwind CSS.

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

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Calculator.jsx    # Main input form with real-time mode
│   │   ├── Results.jsx        # Interactive results with charts
│   │   ├── Analytics.jsx      # Intelligence dashboard
│   │   └── History.jsx        # Archive with search/filter
│   ├── App.jsx                # Main layout with navigation
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind + custom styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
```

---

## 🧩 Components

### Calculator (Analysis Lab)
- Real-time input with educational tooltips
- Debounced auto-calculation (800ms)
- Five calculation methods (SMB, AMB, RMB, LK-IMB, CIMB)
- Results component with interactive charts

### Results
- Interactive visualizations using Recharts
- Statistical confidence interval displays
- Risk-based color coding
- Export to PDF and CSV

### Analytics (Intelligence Dashboard)
- Trend analysis across all calculations
- Method distribution charts
- Risk profiling
- AI-powered insights

### History (Archive)
- Search and filter functionality
- Pagination
- Batch operations
- Status filtering

---

## 🎨 Design System

### Color Palette

```
Background:  slate-950 (#0f172a)
Cards:       slate-900/90 with backdrop-blur
Primary:     blue-500 (#3b82f6)
Secondary:   violet-500 (#8b5cf6)
Success:     green-500 (#10b981)
Warning:     yellow-500 (#f59e0b)
Indicator:   cyan-500 (#06b6d4)
Danger:      red-500 (#ef4444)
```

### Typography

- **Headers:** Bold, 2xl-4xl sizes
- **Body:** Regular, sm-base sizes
- **Mono:** Font-mono for sample IDs

### Components

- **Glass Cards:** Backdrop-blur-xl with semi-transparent backgrounds
- **Gradient Buttons:** Blue-to-violet with hover states
- **Badges:** Color-coded status indicators
- **Tooltips:** Dark slate with smooth animations

---

## 🔧 Configuration

### Vite Configuration

```javascript
// vite.config.js
export default {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```

### Tailwind Configuration

Custom theme extensions in `tailwind.config.js`:
- Custom colors
- Glow shadows
- Backdrop blur utilities

---

## 📦 Dependencies

### Core
- **react** (^18.2.0) - UI framework
- **react-dom** (^18.2.0) - DOM rendering

### UI & Animations
- **framer-motion** (^11.0.3) - Animation library
- **lucide-react** (^0.344.0) - Icon library
- **tailwindcss** (^3.4.19) - Utility-first CSS

### Data Visualization
- **recharts** (^2.15.4) - Chart library

### Utilities
- **axios** (^1.6.5) - HTTP client
- **jspdf** (^2.5.2) - PDF generation

### Dev Dependencies
- **vite** (^5.1.0) - Build tool
- **@vitejs/plugin-react** (^4.2.1) - React plugin for Vite
- **eslint** - Code linting
- **autoprefixer** - CSS vendor prefixes
- **postcss** - CSS processing

---

## 🎯 Key Features

### Real-Time Calculation Mode

Auto-calculate with debounced updates:
```javascript
useEffect(() => {
  if (!autoCalculate) return;
  const timer = setTimeout(() => {
    handleCalculate(true);
  }, 800);
  return () => clearTimeout(timer);
}, [inputs, autoCalculate]);
```

### Educational Tooltips

Hover-activated explanations:
```jsx
<Tooltip content="Starting purity of API before stress testing">
  <Info size={14} className="text-slate-500 hover:text-blue-400" />
</Tooltip>
```

### Export Functionality

- **PDF:** 4-page comprehensive report with jsPDF
- **CSV:** Tabular data export for Excel/analysis

### Interactive Visualizations

- Bar Chart: Method comparison with confidence intervals
- Radar Chart: Performance profile across metrics
- Area Chart: Historical trend analysis
- Pie Chart: Method distribution

---

## 🐛 Troubleshooting

### Port 5173 Already in Use

```bash
npx kill-port 5173
# Or change port in vite.config.js
```

### Backend Connection Error

Ensure backend is running on `http://localhost:5000`:
```bash
curl http://localhost:5000/
```

### Build Errors

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Tailwind Styles Not Loading

Ensure `postcss.config.js` and `tailwind.config.js` are properly configured.

---

## 📚 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Recharts Examples](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📄 API Integration

The frontend communicates with the backend via REST API:

```javascript
// Example API call
import axios from 'axios';

const response = await axios.post('http://localhost:5000/api/calculate', {
  // calculation data
});
```

See [Backend Documentation](../backend/README.md) for API endpoints.

---

**Frontend built with React, Vite, and modern web technologies** 🚀
