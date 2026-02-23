# Excel Service - Mass Balance Calculator

## Overview

This service generates professional Excel reports from the Mass Balance Calculator backend database.

## Features

- ✅ **Database Integration** - Fetches data directly from SQLite backend
- ✅ **Multiple Report Types** - Latest calculation, specific ID, or full history
- ✅ **Comprehensive Sheets**:
  - Calculation Input (with actual data from database)
  - Mass Balance Results (all 5 methods with confidence intervals)
  - Diagnostic Report (with analysis and rationale)
  - Calculation History (optional)
- ✅ **Professional Formatting** - Color-coded risk levels, borders, and styling
- ✅ **Command-Line Interface** - Flexible report generation

## Requirements

```bash
pip install openpyxl
```

## Usage

### Generate Report from Latest Calculation

```bash
python generate_mass_balance_excel.py
```

### Generate Report with Custom Filename

```bash
python generate_mass_balance_excel.py -o MyReport.xlsx
```

### Generate Report for Specific Calculation ID

```bash
python generate_mass_balance_excel.py --id <calculation-id>
```

### Include Calculation History

```bash
python generate_mass_balance_excel.py --history
```

### Specify Custom Database Path

```bash
python generate_mass_balance_excel.py --db /path/to/mass_balance.db
```

### Combined Options

```bash
python generate_mass_balance_excel.py -o FullReport.xlsx --history --id abc123
```

## Command-Line Arguments

| Argument | Short | Description | Default |
|----------|-------|-------------|---------|
| `--output` | `-o` | Output filename | `Mass_Balance_Report.xlsx` |
| `--id` | | Specific calculation ID | Latest calculation |
| `--history` | | Include calculation history sheet | False |
| `--db` | | Database path | `../backend/mass_balance.db` |
| `--help` | `-h` | Show help message | |

## Report Structure

### Sheet 1: Calculation Input
- Sample information (ID, analyst, stress type, date)
- API measurements (initial, stressed, loss)
- Degradant measurements (initial, stressed, formation)
- Correction factors (MW, RRF)

### Sheet 2: Mass Balance Results
- All 5 calculation methods (SMB, AMB, RMB, LK-IMB, CIMB)
- 95% Confidence intervals for LK-IMB and CIMB
- Risk level classification (LOW/MODERATE/HIGH)
- Status indicators (PASS/ALERT/OOS)
- Summary with recommended method

### Sheet 3: Diagnostic Report
- Detailed diagnostic message
- Scientific rationale
- Correction factors breakdown

### Sheet 4: Calculation History (Optional)
- All calculations from database
- Timestamp, sample ID, analyst, method, status
- Sortable and filterable data

## Integration with Backend

The Excel generator automatically connects to the backend SQLite database at:
```
../backend/mass_balance.db
```

It reads from the `calculations` table which contains all saved mass balance calculations with full statistical analysis.

## Database Schema

The generator expects the following fields from the database:
- Input data: `initial_api`, `stressed_api`, `initial_degradants`, `stressed_degradants`, `parent_mw`, `degradant_mw`, `rrf`
- Results: `smb`, `amb`, `rmb`, `lk_imb`, `cimb`
- Statistical: `lk_imb_lower_ci`, `lk_imb_upper_ci`, `cimb_lower_ci`, `cimb_upper_ci`
- Risk: `lk_imb_risk_level`, `cimb_risk_level`, `status`
- Metadata: `sample_id`, `analyst_name`, `stress_type`, `timestamp`
- Analysis: `recommended_method`, `diagnostic_message`, `rationale`

## Error Handling

The script will:
- ✅ Check if database file exists
- ✅ Validate calculation ID if provided
- ✅ Handle missing data gracefully
- ✅ Provide clear error messages

## Examples

### Example 1: Quick Report
```bash
python generate_mass_balance_excel.py
```
Output: `Mass_Balance_Report.xlsx` with latest calculation

### Example 2: Full History Report
```bash
python generate_mass_balance_excel.py -o History_Report.xlsx --history
```
Output: `History_Report.xlsx` with all calculations

### Example 3: Specific Sample Report
```bash
python generate_mass_balance_excel.py --id abc-123-def --history
```
Output: Report for calculation `abc-123-def` with history

## Notes

- The generator uses the latest calculation by default
- All percentages are formatted to 2 decimal places
- Risk levels are color-coded: GREEN (LOW), YELLOW (MODERATE), RED (HIGH)
- Confidence intervals are only shown for LK-IMB and CIMB methods
- The database path is relative to the script location

## Troubleshooting

**Database not found:**
```
FileNotFoundError: Database not found at: ../backend/mass_balance.db
```
Solution: Ensure the backend database exists or specify correct path with `--db`

**Calculation ID not found:**
```
ValueError: Calculation ID xyz not found in database
```
Solution: Verify the calculation ID exists in the database

**No calculations in database:**
The script will generate a template report with placeholder values.

---

**Version:** 2.1.0  
**Last Updated:** February 2026
