import xlsxwriter
from datetime import datetime

# Create the workbook and worksheets
workbook = xlsxwriter.Workbook('Mass_Balance_Calculator_Pro.xlsx')

# --- DEFINING FORMATS ---
# Colors
header_bg = '#1F4E78'  # Dark Blue
header_font = '#FFFFFF' # White
input_bg = '#FFF2CC'   # Light Yellow
output_bg = '#D9E1F2'  # Light Blue
pass_bg = '#C6EFCE'    # Light Green
alert_bg = '#FFEB9C'   # Light Yellow/Orange
oos_bg = '#FFC7CE'     # Light Red
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

# Conditional Formats (Green/Red text)
pass_fmt = workbook.add_format({'bg_color': pass_bg, 'font_color': '#006100'})
alert_fmt = workbook.add_format({'bg_color': alert_bg, 'font_color': '#9C5700'})
oos_fmt = workbook.add_format({'bg_color': oos_bg, 'font_color': '#9C0006'})

# --- TAB 1: DATA ENTRY ---
ws_input = workbook.add_worksheet('Data Entry')
ws_input.set_column('A:A', 30)
ws_input.set_column('B:B', 20)
ws_input.set_column('C:C', 5) # Spacer
ws_input.set_column('D:D', 40) # Instructions

# Title
ws_input.merge_range('A1:B1', 'Mass Balance Calculator - ICH Q1A(R2) Compliant', header_fmt)

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
ws_input.merge_range('D3:D10', 
                     "INSTRUCTIONS:\n\n1. Enter experimental data in YELLOW cells.\n\n"
                     "2. Default values provided for testing.\n\n"
                     "3. Navigate to 'Diagnostic Report' tab to see analysis.\n\n"
                     "4. Use 'Trend Tracking' for stability studies.",
                     workbook.add_format({'border': 1, 'valign': 'top', 'text_wrap': True}))

# "Calculate" Button Graphic (Visual only)
btn_fmt = workbook.add_format({'bg_color': '#4472C4', 'font_color': 'white', 'bold': True, 'align': 'center', 'valign': 'vcenter'})
ws_input.merge_range('A14:B15', "GO TO REPORT >>", btn_fmt)
ws_input.write_url('A14', "internal:'Diagnostic Report'!A1")

# --- TAB 2: CALCULATIONS (HIDDEN ENGINE) ---
ws_calc = workbook.add_worksheet('Calculations')
ws_calc.set_column('A:B', 25)

ws_calc.write('A1', 'PARAMETER', header_fmt)
ws_calc.write('B1', 'VALUE', header_fmt)

# Named Ranges mapping for easier formulas
# In real Excel generation we just point to the cells
# B3=InitialAPI, B4=StressedAPI, B5=InitDeg, B6=StressedDeg
# B7=ParentMW, B8=DegMW, B9=RRF

# Calculations
calcs = [
    ('Delta API', "='Data Entry'!B3-'Data Entry'!B4"),
    ('Delta Deg', "='Data Entry'!B6-'Data Entry'!B5"),
    ('Lambda (RRF Corr)', "=IF('Data Entry'!B9=\"\", 1, 1/'Data Entry'!B9)"),
    ('Omega (MW Corr)', "=IF(OR('Data Entry'!B7=\"\", 'Data Entry'!B8=\"\"), 1, 'Data Entry'!B7/'Data Entry'!B8)"),
    ('Corrected Deg', "='Data Entry'!B6 * B4 * B5"), # StressedDeg * Lambda * Omega
    ('SMB Result', "='Data Entry'!B4 + 'Data Entry'!B6"),
    ('AMB Result', "=('Data Entry'!B4 + 'Data Entry'!B6)/('Data Entry'!B3 + 'Data Entry'!B5)*100"),
    ('RMB Result', "=IF(B2=0, 0, (B3/B2)*100)"),
    ('LK-IMB Result', "=('Data Entry'!B4 + B6)/'Data Entry'!B3*100"), # (StressedAPI + CorrDeg)/InitAPI
    ('Rec. Method', "=IF(B2<2, \"AMB\", IF(B2>20, \"LK-IMB\", \"RMB\"))"),
    ('Rec. Value', "=IF(B11=\"AMB\", B8, IF(B11=\"LK-IMB\", B10, B9))"),
    ('Status', "=IF(B12>=95, \"PASS\", IF(B12>=90, \"ALERT\", \"OOS\"))")
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
ws_rep.write('D4', "Sample ID:", label_fmt)
ws_rep.write_formula('E4', "='Data Entry'!B11", workbook.add_format({'align': 'left'}))

# Results Table
ws_rep.write('B6', "Method", header_fmt)
ws_rep.write('C6', "Result (%)", header_fmt)
ws_rep.write('D6', "Correction", header_fmt)

# SMB
ws_rep.write('B7', "SMB (Uncorrected)", workbook.add_format({'border':1}))
ws_rep.write_formula('C7', "=Calculations!B7", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center'}))
ws_rep.write('D7', "None", workbook.add_format({'border':1, 'align':'center', 'font_color':'gray'}))

# AMB
ws_rep.write('B8', "AMB (Absolute)", workbook.add_format({'border':1}))
ws_rep.write_formula('C8', "=Calculations!B8", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center'}))
ws_rep.write('D8', "Purity Norm.", workbook.add_format({'border':1, 'align':'center'}))

# LK-IMB (Highlight)
lk_fmt = workbook.add_format({'border':1, 'bg_color': '#E2EFDA', 'bold': True})
ws_rep.write('B9', "LK-IMB (Proposed)", lk_fmt)
ws_rep.write_formula('C9', "=Calculations!B10", workbook.add_format({'num_format': '0.0', 'border':1, 'align':'center', 'bg_color': '#E2EFDA', 'bold': True}))
ws_rep.write('D9', "Stoich + RRF", workbook.add_format({'border':1, 'align':'center', 'bg_color': '#E2EFDA'}))

# Final Status Box
ws_rep.merge_range('B11:C11', "FINAL STATUS", header_fmt)
ws_rep.merge_range('B12:C13', "", workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 14, 'bold': True}))
ws_rep.write_formula('B12', "=Calculations!B13", workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 14, 'bold': True}))

# Conditional Formatting for Status
ws_rep.conditional_format('B12', {'type': 'cell', 'criteria': '==', 'value': '"PASS"', 'format': pass_fmt})
ws_rep.conditional_format('B12', {'type': 'cell', 'criteria': '==', 'value': '"ALERT"', 'format': alert_fmt})
ws_rep.conditional_format('B12', {'type': 'cell', 'criteria': '==', 'value': '"OOS"', 'format': oos_fmt})

# Diagnostic Logic Box
ws_rep.merge_range('D11:E11', "DIAGNOSTIC", header_fmt)
ws_rep.merge_range('D12:E13', "", workbook.add_format({'border': 1, 'text_wrap': True, 'valign': 'top'}))
diag_formula = (
    "=IF(AND(Calculations!B13=\"OOS\", Calculations!B4=1), \"FAIL: Suspected Volatile Loss. Rec: Headspace GC.\", "
    "IF(AND(Calculations!B13=\"OOS\", Calculations!B4>1.2), \"FAIL: UV-Silent Impurity. Rec: CAD Detection.\", "
    "IF(Calculations!B13=\"PASS\", \"Mass Balance Compliant per ICH Q1A.\", "
    "\"Investigate: Borderline Result.\")))"
)
ws_rep.write_formula('D12', diag_formula)

# --- TAB 4: TREND TRACKING (CHART) ---
ws_trend = workbook.add_worksheet('Trend Tracking')
ws_trend.set_column('A:E', 12)

# Headers
headers = ['Day', 'SMB', 'AMB', 'LK-IMB', 'Status']
for col, h in enumerate(headers):
    ws_trend.write(0, col, h, header_fmt)

# Dummy Data
data = [
    [0, 99.5, 100.0, 100.0, 'PASS'],
    [7, 95.0, 96.2, 98.5, 'PASS'],
    [14, 88.0, 90.1, 97.4, 'PASS'],
    [30, 82.0, 85.5, 96.2, 'PASS'],
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

chart.set_title({'name': 'Mass Balance Stability Trend'})
chart.set_x_axis({'name': 'Time (Days)'})
chart.set_y_axis({'name': 'Mass Balance (%)', 'min': 80, 'max': 105})
chart.set_size({'width': 600, 'height': 350})

# Add Specification Lines (Visual Trick)
# In Python generated charts, simpler to just set the Y-axis min/max or use a combined chart for limit lines.
# Here we keep it simple for the prototype.

ws_trend.insert_chart('G2', chart)

workbook.close()
print("Excel file 'Mass_Balance_Calculator_Pro.xlsx' generated successfully.")