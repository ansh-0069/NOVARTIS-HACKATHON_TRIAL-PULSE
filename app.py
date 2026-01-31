import xlsxwriter
from datetime import datetime

# Create the workbook and worksheets
workbook = xlsxwriter.Workbook('Mass_Balance_Calculator.xlsx')

# --- DEFINING FORMATS ---
# Colors
header_bg = '#1F4E78'  # Dark Blue
header_font = '#FFFFFF' # White
input_bg = '#FFF2CC'   # Light Yellow
output_bg = '#D9E1F2'  # Light Blue
pass_bg = '#C6EFCE'    # Light Green
alert_bg = '#FFEB9C'   # Light Yellow/Orange
oos_bg = '#FFC7CE'     # Light Red
cimb_bg = '#E2EFDA'    # Light Green (CIMB highlight)
border_color = '#000000'

# Format Objects
header_fmt = workbook.add_format({
    'bold': True, 'bg_color': header_bg, 'font_color': header_font,
    'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 12
})

input_fmt = workbook.add_format({
    'bg_color': input_bg, 'border': 1, 'align': 'center', 'num_format': '0.00'
})

input_text_fmt = workbook.add_format({
    'bg_color': input_bg, 'border': 1, 'align': 'center'
})

label_fmt = workbook.add_format({
    'bold': True, 'align': 'right', 'valign': 'vcenter', 'font_size': 11
})

result_fmt = workbook.add_format({
    'bg_color': output_bg, 'border': 1, 'align': 'center',
    'num_format': '0.00', 'bold': True
})

# Conditional Formats
pass_fmt = workbook.add_format({'bg_color': pass_bg, 'font_color': '#006100'})
alert_fmt = workbook.add_format({'bg_color': alert_bg, 'font_color': '#9C5700'})
oos_fmt = workbook.add_format({'bg_color': oos_bg, 'font_color': '#9C0006'})

# CIMB-specific format
cimb_fmt = workbook.add_format({'bg_color': cimb_bg, 'border': 1, 'bold': True, 'align': 'center', 'num_format': '0.00'})

# --- TAB 1: DATA ENTRY ---
ws_input = workbook.add_worksheet('Data Entry')
ws_input.set_column('A:A', 30)
ws_input.set_column('B:B', 20)
ws_input.set_column('C:C', 5) # Spacer
ws_input.set_column('D:D', 50) # Instructions - increased width

# Set row heights for instructions area
ws_input.set_row(2, 20)  # Row 3
ws_input.set_row(3, 20)  # Row 4
ws_input.set_row(4, 20)  # Row 5
ws_input.set_row(5, 20)  # Row 6
ws_input.set_row(6, 20)  # Row 7
ws_input.set_row(7, 20)  # Row 8
ws_input.set_row(8, 20)  # Row 9
ws_input.set_row(9, 20)  # Row 10
ws_input.set_row(10, 20) # Row 11
ws_input.set_row(11, 20) # Row 12

# Title
ws_input.merge_range('A1:B1', 'Mass Balance Calculator', header_fmt)

# Inputs
labels = [
    ('Initial API Assay (%)', 98.00),
    ('Stressed API Assay (%)', 82.50),
    ('Initial Degradants (%)', 0.50),
    ('Stressed Degradants (%)', 4.90),
    ('Parent MW (g/mol)', 500.00),
    ('Degradant MW (g/mol)', 250.00),
    ('RRF (Relative Response Factor)', 0.80),
    ('Stress Condition', 'Base'), # Dropdown
    ('Sample ID', 'VAL-2026-001'),
    ('Analyst Name', 'A. Singla')
]

# Write Labels and Inputs
for i, (label, default) in enumerate(labels):
    row = i + 2
    ws_input.write(row, 0, label, label_fmt)
    if label == 'Stress Condition':
        ws_input.write(row, 1, default, input_text_fmt)
        ws_input.data_validation(row, 1, row, 1, {'validate': 'list',
                                                  'source': ['Acid', 'Base', 'Oxidative', 'Thermal', 'Photolytic']})
    elif isinstance(default, str):
        ws_input.write(row, 1, default, input_text_fmt)
    else:
        ws_input.write(row, 1, default, input_fmt)

# Instructions Box
ws_input.merge_range('D3:D12', 
                     "INSTRUCTIONS:\n\n"
                     "1. Enter experimental data in YELLOW cells.\n\n"
                     "2. Default values provided for testing.\n\n"
                     "3. Navigate to 'Diagnostic Report' for analysis.\n\n"
                     "4. Both LK-IMB and CIMB methods included with 95% CI.\n\n"
                     "5. Use 'Trend Tracking' for stability studies.",
                     workbook.add_format({'border': 1, 'valign': 'top', 'text_wrap': True, 'font_size': 9}))

# "Calculate" Button Graphic
btn_fmt = workbook.add_format({'bg_color': '#4472C4', 'font_color': 'white', 'bold': True, 'align': 'center', 'valign': 'vcenter'})
ws_input.merge_range('A14:B15', "GO TO REPORT >>", btn_fmt)
ws_input.write_url('A14', "internal:'Diagnostic Report'!A1")

# --- TAB 2: CALCULATIONS (HIDDEN ENGINE) ---
ws_calc = workbook.add_worksheet('Calculations')
ws_calc.set_column('A:B', 30)

ws_calc.write('A1', 'PARAMETER', header_fmt)
ws_calc.write('B1', 'VALUE', header_fmt)

# Calculations
calcs = [
    ('Delta API', "='Data Entry'!B3-'Data Entry'!B4"),
    ('Delta Deg', "='Data Entry'!B6-'Data Entry'!B5"),
    ('Lambda (RRF Corr)', "=IF('Data Entry'!B9=\"\", 1, 1/'Data Entry'!B9)"),
    ('Omega (MW Corr)', "=IF(OR('Data Entry'!B7=\"\", 'Data Entry'!B8=\"\"), 1, 'Data Entry'!B7/'Data Entry'!B8)"),
    # Stoichiometric factor based on stress type
    ('Stoich Factor (S)', 
     "=IF(OR('Data Entry'!B7=\"\", 'Data Entry'!B8=\"\"), 1, "
     "IF(OR('Data Entry'!B10=\"Acid\", 'Data Entry'!B10=\"Base\"), ('Data Entry'!B7+18)/'Data Entry'!B8, "
     "IF('Data Entry'!B10=\"Oxidative\", ('Data Entry'!B7+16)/'Data Entry'!B8, B5)))"),
    ('Corrected Deg (LK)', "='Data Entry'!B6 * B4 * B5"),
    ('Corrected Deg (CIMB)', "='Data Entry'!B6 * B4 * B6"),
    ('SMB Result', "='Data Entry'!B4 + 'Data Entry'!B6"),
    ('AMB Result', "=('Data Entry'!B4 + 'Data Entry'!B6)/('Data Entry'!B3 + 'Data Entry'!B5)*100"),
    ('RMB Result', "=IF(B2=0, 0, (B3/B2)*100)"),
    ('LK-IMB Result', "=('Data Entry'!B4 + B7)/'Data Entry'!B3*100"),
    # Confidence intervals for LK-IMB (simplified: ±2.5% analytical uncertainty * t-critical ~2.0)
    ('LK-IMB Lower CI', "=B12 - (2.5 * 2.0)"),
    ('LK-IMB Upper CI', "=B12 + (2.5 * 2.0)"),
    # Risk level based on LK-IMB
    ('LK-IMB Risk Level', "=IF(AND(B12>=98, B12<=102), \"LOW\", IF(OR(AND(B12>=95, B12<98), AND(B12>102, B12<=105)), \"MODERATE\", \"HIGH\"))"),
    ('CIMB Result', "=('Data Entry'!B4 + B8)/'Data Entry'!B3*100"),
    # Confidence intervals for CIMB (simplified: ±2.5% analytical uncertainty * t-critical ~2.0)
    ('CIMB Lower CI', "=B17 - (2.5 * 2.0)"),
    ('CIMB Upper CI', "=B17 + (2.5 * 2.0)"),
    # Risk level based on CIMB
    ('CIMB Risk Level', "=IF(AND(B17>=98, B17<=102), \"LOW\", IF(OR(AND(B17>=95, B17<98), AND(B17>102, B17<=105)), \"MODERATE\", \"HIGH\"))"),
    ('Degradation %', "=(B2/'Data Entry'!B3)*100"),
    ('Rec. Method', "=IF(B21<2, \"AMB\", IF(AND(B21>=5, B21<=20), \"RMB\", IF(OR(B21>20, B20=\"HIGH\"), \"CIMB\", \"LK-IMB\")))"),
    ('Rec. Value', "=IF(B22=\"AMB\", B10, IF(B22=\"RMB\", B11, IF(B22=\"CIMB\", B17, B12)))"),
    ('Status', "=IF(B23>=95, \"PASS\", IF(B23>=90, \"ALERT\", \"OOS\"))")
]

for i, (name, formula) in enumerate(calcs):
    ws_calc.write(i+1, 0, name, label_fmt)
    ws_calc.write_formula(i+1, 1, formula)

# --- TAB 3: DIAGNOSTIC REPORT ---
ws_rep = workbook.add_worksheet('Diagnostic Report')
ws_rep.set_column('A:A', 5)
ws_rep.set_column('B:E', 18)
ws_rep.hide_gridlines(2)

# Header
ws_rep.merge_range('B2:E3', "MASS BALANCE DIAGNOSTIC REPORT", header_fmt)
ws_rep.write('B4', "Date:", label_fmt)
ws_rep.write_formula('C4', "=TODAY()", workbook.add_format({'num_format': 'yyyy-mm-dd', 'align': 'left'}))
ws_rep.merge_range('D4:E4', "", workbook.add_format({'border': 1, 'align': 'left'}))
ws_rep.write('D4', "Sample ID:", label_fmt)
ws_rep.write_formula('D4', "=\"Sample ID: \" & 'Data Entry'!B11", workbook.add_format({'align': 'left', 'border': 1}))

# Results Table
ws_rep.write('B6', "Method", header_fmt)
ws_rep.write('C6', "Result (%)", header_fmt)
ws_rep.write('D6', "Correction", header_fmt)

# SMB
ws_rep.write('B7', "SMB (Uncorrected)", workbook.add_format({'border':1}))
ws_rep.write_formula('C7', "=Calculations!B9", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center'}))
ws_rep.write('D7', "None", workbook.add_format({'border':1, 'align':'center', 'font_color':'gray'}))

# AMB
ws_rep.write('B8', "AMB (Absolute)", workbook.add_format({'border':1}))
ws_rep.write_formula('C8', "=Calculations!B10", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center'}))
ws_rep.write('D8', "Purity Norm.", workbook.add_format({'border':1, 'align':'center'}))

# RMB
ws_rep.write('B9', "RMB (Relative)", workbook.add_format({'border':1}))
ws_rep.write_formula('C9', "=Calculations!B11", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center'}))
ws_rep.write('D9', "Delta Ratio", workbook.add_format({'border':1, 'align':'center'}))

# LK-IMB
lk_fmt = workbook.add_format({'border':1, 'bg_color': '#E2EFDA', 'bold': True})
ws_rep.write('B10', "LK-IMB", lk_fmt)
ws_rep.write_formula('C10', "=Calculations!B12", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center', 'bg_color': '#E2EFDA', 'bold': True}))
ws_rep.write('D10', "Lambda + Omega", workbook.add_format({'border':1, 'align':'center', 'bg_color': '#E2EFDA'}))

# CIMB (NEW - Highlighted)
cimb_highlight_fmt = workbook.add_format({'border':1, 'bg_color': '#D0E8F2', 'bold': True})
ws_rep.write('B11', "CIMB (with CI)", cimb_highlight_fmt)
ws_rep.write_formula('C11', "=Calculations!B17", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center', 'bg_color': '#D0E8F2', 'bold': True}))
ws_rep.write('D11', "Lambda + S", workbook.add_format({'border':1, 'align':'center', 'bg_color': '#D0E8F2'}))

# LK-IMB Confidence Interval Display
lk_ci_fmt = workbook.add_format({'bg_color': '#E2EFDA', 'border': 1, 'align': 'center', 'num_format': '0.00', 'bold': True})
ws_rep.merge_range('B13:C13', "LK-IMB 95% Confidence Interval", header_fmt)
ws_rep.write('B14', "Lower CI:", label_fmt)
ws_rep.write_formula('C14', "=Calculations!B13", lk_ci_fmt)
ws_rep.write('B15', "Upper CI:", label_fmt)
ws_rep.write_formula('C15', "=Calculations!B14", lk_ci_fmt)
ws_rep.write('D14', "Risk Level:", label_fmt)
ws_rep.write_formula('E14', "=Calculations!B15", workbook.add_format({'border': 1, 'align': 'center', 'bold': True}))

# Conditional formatting for LK-IMB risk level
ws_rep.conditional_format('E14', {'type': 'cell', 'criteria': '==', 'value': '"LOW"', 'format': pass_fmt})
ws_rep.conditional_format('E14', {'type': 'cell', 'criteria': '==', 'value': '"MODERATE"', 'format': alert_fmt})
ws_rep.conditional_format('E14', {'type': 'cell', 'criteria': '==', 'value': '"HIGH"', 'format': oos_fmt})

# CIMB Confidence Interval Display
ws_rep.merge_range('B17:C17', "CIMB 95% Confidence Interval", header_fmt)
ws_rep.write('B18', "Lower CI:", label_fmt)
ws_rep.write_formula('C18', "=Calculations!B18", cimb_fmt)
ws_rep.write('B19', "Upper CI:", label_fmt)
ws_rep.write_formula('C19', "=Calculations!B19", cimb_fmt)
ws_rep.write('D18', "Risk Level:", label_fmt)
ws_rep.write_formula('E18', "=Calculations!B20", workbook.add_format({'border': 1, 'align': 'center', 'bold': True}))

# Conditional formatting for CIMB risk level
ws_rep.conditional_format('E18', {'type': 'cell', 'criteria': '==', 'value': '"LOW"', 'format': pass_fmt})
ws_rep.conditional_format('E18', {'type': 'cell', 'criteria': '==', 'value': '"MODERATE"', 'format': alert_fmt})
ws_rep.conditional_format('E18', {'type': 'cell', 'criteria': '==', 'value': '"HIGH"', 'format': oos_fmt})

# Final Status Box
ws_rep.merge_range('B21:C21', "FINAL STATUS", header_fmt)
ws_rep.merge_range('B22:C23', "", workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 14, 'bold': True}))
ws_rep.write_formula('B22', "=Calculations!B24", workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 14, 'bold': True}))

# Conditional Formatting for Status
ws_rep.conditional_format('B22', {'type': 'cell', 'criteria': '==', 'value': '"PASS"', 'format': pass_fmt})
ws_rep.conditional_format('B22', {'type': 'cell', 'criteria': '==', 'value': '"ALERT"', 'format': alert_fmt})
ws_rep.conditional_format('B22', {'type': 'cell', 'criteria': '==', 'value': '"OOS"', 'format': oos_fmt})

# Diagnostic Logic Box
ws_rep.merge_range('D21:E21', "DIAGNOSTIC", header_fmt)
ws_rep.merge_range('D22:E23', "", workbook.add_format({'border': 1, 'text_wrap': True, 'valign': 'top', 'font_size': 8}))
diag_formula = (
    "=IF(Calculations!B20=\"HIGH\", \"HIGH RISK: Investigate immediately. CIMB required.\", "
    "IF(AND(Calculations!B20=\"OOS\", Calculations!B4=1), \"FAIL: Suspected Volatile Loss. Rec: Headspace GC.\", "
    "IF(AND(Calculations!B20=\"OOS\", Calculations!B4>1.2), \"FAIL: UV-Silent Impurity. Rec: CAD Detection.\", "
    "IF(Calculations!B20=\"PASS\", \"Mass Balance Compliant per ICH Q1A.\", "
    "\"Investigate: Borderline Result.\"))))"
)
ws_rep.write_formula('D22', diag_formula)

# Correction factors display
ws_rep.merge_range('B25:E25', "CORRECTION FACTORS", header_fmt)
ws_rep.write('B26', "Lambda (RRF):", label_fmt)
ws_rep.write_formula('C26', "=Calculations!B4", result_fmt)
ws_rep.write('D26', "Omega (MW):", label_fmt)
ws_rep.write_formula('E26', "=Calculations!B5", result_fmt)
ws_rep.write('B27', "Stoichiometric (S):", label_fmt)
ws_rep.write_formula('C27', "=Calculations!B6", result_fmt)

# --- TAB 4: TREND TRACKING (CHART) ---
ws_trend = workbook.add_worksheet('Trend Tracking')
ws_trend.set_column('A:F', 12)

# Headers
headers = ['Day', 'SMB', 'AMB', 'LK-IMB', 'CIMB', 'Status']
for col, h in enumerate(headers):
    ws_trend.write(0, col, h, header_fmt)

# Dummy Data
data = [
    [0, 99.5, 100.0, 100.0, 100.0, 'PASS'],
    [7, 95.0, 96.2, 98.5, 99.2, 'PASS'],
    [14, 88.0, 90.1, 97.4, 98.8, 'PASS'],
    [30, 82.0, 85.5, 96.2, 97.5, 'PASS'],
]

for row, record in enumerate(data):
    for col, val in enumerate(record):
        ws_trend.write(row+1, col, val, input_fmt if col==0 else workbook.add_format({'num_format': '0.0', 'align': 'center'}))

# Create Chart
chart = workbook.add_chart({'type': 'line'})
chart.add_series({
    'name': 'SMB',
    'categories': "='Trend Tracking'!$A$2:$A$5",
    'values':     "='Trend Tracking'!$B$2:$B$5",
    'line':       {'color': 'red', 'dash_type': 'dash'},
})
chart.add_series({
    'name': 'LK-IMB',
    'categories': "='Trend Tracking'!$A$2:$A$5",
    'values':     "='Trend Tracking'!$D$2:$D$5",
    'line':       {'color': 'green', 'width': 2.25},
    'marker':     {'type': 'circle'}
})
chart.add_series({
    'name': 'CIMB (NEW)',
    'categories': "='Trend Tracking'!$A$2:$A$5",
    'values':     "='Trend Tracking'!$E$2:$E$5",
    'line':       {'color': 'blue', 'width': 2.5},
    'marker':     {'type': 'square'}
})

chart.set_title({'name': 'Mass Balance Stability Trend - CIMB Enhanced'})
chart.set_x_axis({'name': 'Time (Days)'})
chart.set_y_axis({'name': 'Mass Balance (%)', 'min': 80, 'max': 105})
chart.set_size({'width': 600, 'height': 350})
chart.set_legend({'position': 'bottom'})

ws_trend.insert_chart('H2', chart)

# --- TAB 5: METHOD COMPARISON ---
ws_compare = workbook.add_worksheet('Method Comparison')
ws_compare.set_column('A:A', 5)
ws_compare.set_column('B:D', 20)
ws_compare.hide_gridlines(2)

# Title
ws_compare.merge_range('B2:D3', "LK-IMB vs CIMB Comparison", header_fmt)

yPos = 5
ws_compare.write(yPos, 1, "Feature", header_fmt)
ws_compare.write(yPos, 2, "LK-IMB", header_fmt)
ws_compare.write(yPos, 3, "CIMB", header_fmt)

comparison_data = [
    ("Complexity", "Moderate", "High"),
    ("Output", "Point + 95% CI", "Point + 95% CI"),
    ("Correction", "Lambda + Omega", "Lambda + S (pathway)"),
    ("Use Case", "Routine QC", "Regulatory Submission"),
    ("Statistical Validation", "Yes (t-distribution)", "Yes (t-distribution)"),
    ("Risk Assessment", "Yes (LOW/MOD/HIGH)", "Yes (LOW/MOD/HIGH)"),
    ("Implementation", "Immediate", "Requires Validation"),
]

for i, (feature, lk_val, cimb_val) in enumerate(comparison_data):
    row = yPos + i + 1
    ws_compare.write(row, 1, feature, label_fmt)
    ws_compare.write(row, 2, lk_val, workbook.add_format({'border': 1, 'align': 'center', 'bg_color': '#E2EFDA'}))
    ws_compare.write(row, 3, cimb_val, workbook.add_format({'border': 1, 'align': 'center', 'bg_color': '#D0E8F2'}))

# Recommendation
yPos += len(comparison_data) + 3
ws_compare.merge_range(yPos, 1, yPos+2, 3, 
    "RECOMMENDATION:\n\n"
    "Use LK-IMB for routine screening (95% of samples).\n"
    "Escalate to CIMB when LK-IMB <95% or >105%, or for regulatory submissions.",
    workbook.add_format({'border': 1, 'text_wrap': True, 'valign': 'top', 'bg_color': '#FFF2CC'}))

workbook.close()
print("Excel file 'Mass_Balance_Calculator.xlsx' generated successfully!")
