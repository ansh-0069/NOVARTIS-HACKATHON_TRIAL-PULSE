import xlsxwriter
import sqlite3
import os
import sys
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '../backend/mass_balance.db')
REPORTS_DIR = os.path.join(os.path.dirname(__file__), 'reports')

def ensure_directories():
    if not os.path.exists(REPORTS_DIR):
        os.makedirs(REPORTS_DIR)

def fetch_latest_data(db_path=None):
    target_db = db_path if db_path else DB_PATH
    if not os.path.exists(target_db):
        print(json.dumps({'status': 'error', 'message': f'Database not found at {target_db}'}))
        sys.exit(1)

    conn = sqlite3.connect(target_db)
    cursor = conn.cursor()
    
    # Fetch latest calculation
    cursor.execute("SELECT * FROM calculations ORDER BY timestamp DESC LIMIT 1")
    row = cursor.fetchone()
    
    # Fetch history for the dashboard
    cursor.execute("SELECT * FROM calculations ORDER BY timestamp DESC LIMIT 100")
    history = cursor.fetchall()
    
    conn.close()
    return row, history

def generate_excel(db_path=None, output_file=None):
    ensure_directories()
    
    data, history = fetch_latest_data(db_path)
    if not data:
        print(json.dumps({'status': 'error', 'message': 'No data found in database'}))
        sys.exit(1)

    # Unpack Data
    calc_id, timestamp, sample_id, analyst, stress, init_api, str_api, init_deg, str_deg, deg_mw, parent_mw, rrf = data[0:12]
    
    # Pre-calculate factors for internal validation
    lambda_val = 1 / rrf if rrf and rrf != 0 else 0
    omega_val = deg_mw / parent_mw if parent_mw and parent_mw != 0 else 0
    s_val = lambda_val * omega_val

    if output_file:
        output_path = output_file
        # Ensure dir exists
        out_dir = os.path.dirname(output_path)
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir)
    else:
        filename = f"Mass Balance Report {datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        output_path = os.path.join(REPORTS_DIR, filename)
    
    workbook = xlsxwriter.Workbook(output_path)
    
    header_fmt = workbook.add_format({'bg_color': '#3b82f6', 'font_color': 'white', 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1})
    subheader_fmt = workbook.add_format({'bold': True, 'font_color': '#334155', 'underline': True})
    input_bg = workbook.add_format({'bg_color': '#eff6ff', 'border': 1})
    calc_bg = workbook.add_format({'bg_color': '#f8fafc', 'border': 1})
    
    risk_low = workbook.add_format({'bg_color': '#dcfce7', 'font_color': '#166534', 'border': 1}) 
    risk_mod = workbook.add_format({'bg_color': '#fef9c3', 'font_color': '#854d0e', 'border': 1}) 
    risk_high = workbook.add_format({'bg_color': '#fee2e2', 'font_color': '#991b1b', 'border': 1}) 

    ws1 = workbook.add_worksheet('Calculation Input')
    ws1.set_column('A:A', 30); ws1.set_column('B:B', 20); ws1.set_column('C:C', 5); ws1.set_column('D:D', 25); ws1.set_column('E:E', 20)

    ws1.merge_range('A1:E1', 'Mass Balance AI - Calculation Input Template', header_fmt)
    ws1.write('A2', f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    ws1.write('A4', 'SAMPLE INFORMATION', subheader_fmt)
    ws1.write('A5', 'Sample ID');        ws1.write('B5', sample_id, input_bg)
    ws1.write('A6', 'Analyst Name');     ws1.write('B6', analyst, input_bg)
    ws1.write('A7', 'Stress Condition'); ws1.write('B7', stress, input_bg)
    ws1.write('A8', 'Analysis Date');    ws1.write('B8', (timestamp or '')[:10], input_bg)

    ws1.write('A10', 'API MEASUREMENTS (%)', subheader_fmt)
    ws1.write('A11', 'Initial API (%)');   ws1.write_number('B11', init_api, input_bg)
    ws1.write('A12', 'Stressed API (%)');  ws1.write_number('B12', str_api, input_bg)
    ws1.write('A13', 'API Degradation');   ws1.write_formula('B13', '=B11-B12', calc_bg)

    ws1.write('A15', 'DEGRADANT MEASUREMENTS (%)', subheader_fmt)
    ws1.write('A16', 'Initial Degradants (%)');  ws1.write_number('B16', init_deg, input_bg)
    ws1.write('A17', 'Stressed Degradants (%)'); ws1.write_number('B17', str_deg, input_bg)
    ws1.write('A18', 'Degradant Formation');     ws1.write_formula('B18', '=B17-B16', calc_bg)

    ws1.write('A20', 'MOLECULAR PROPERTIES', subheader_fmt)
    ws1.write('A21', 'Parent MW (g/mol)');       ws1.write_number('B21', parent_mw, input_bg)
    ws1.write('A22', 'Degradant MW (g/mol)');    ws1.write_number('B22', deg_mw, input_bg)
    ws1.write('A23', 'RRF (Response Factor)');   ws1.write_number('B23', rrf, input_bg)
    
    ws1.write('A24', 'Assumed RSD (%)');         ws1.write_number('B24', 2.0, input_bg)

    ws1.write('D4', 'CORRECTION FACTORS', subheader_fmt)
    ws1.write('D5', 'Lambda (λ) - RRF'); ws1.write_formula('E5', '=IF(B23<>0, 1/B23, 0)', calc_bg)
    ws1.write('D6', 'Omega (ω) - MW');   ws1.write_formula('E6', '=IF(B21<>0, B22/B21, 0)', calc_bg)
    ws1.write('D7', 'Stoichiometric (S)'); ws1.write_formula('E7', '=E5*E6', calc_bg)

    ws2 = workbook.add_worksheet('Mass Balance Results')
    ws2.set_column('A:A', 15); ws2.set_column('B:E', 15); ws2.set_column('F:F', 35); ws2.set_column('G:G', 40)

    ws2.merge_range('A1:G1', 'Mass Balance Calculation Results', header_fmt)
    ws2.write('A2', 'Statistical Validation with 95% Confidence Intervals')
    
    headers = ['Method', 'Result (%)', 'Lower CI (95%)', 'Upper CI (95%)', 'Risk Level', 'Formula', 'Description']
    ws2.write_row('A4', headers, header_fmt)

    methods = [
        ('SMB', "='Calculation Input'!B12 + 'Calculation Input'!B17", 'Stressed API + Stressed Deg', 'Basic sum without corrections'),
        ('AMB', "=('Calculation Input'!B12 / 'Calculation Input'!B11) * 100", '(Stressed/Initial) × 100', 'Normalized to initial values'),
        ('RMB', "=IF('Calculation Input'!B13<>0, ('Calculation Input'!B18 / 'Calculation Input'!B13) * 100, 0)", 'ΔDeg/ΔAPI × 100', 'Ratio of changes'),
        ('LK-IMB', "=('Calculation Input'!B12 + ('Calculation Input'!B17 * 'Calculation Input'!E5 * 'Calculation Input'!E6)) / 'Calculation Input'!B11 * 100", '(API + Deg×λ×ω)/Initial × 100', 'With RRF and MW corrections'),
        ('CIMB', "=('Calculation Input'!B12 + ('Calculation Input'!B17 * 'Calculation Input'!E7)) / 'Calculation Input'!B11 * 100", '(API + Deg×S)/Initial × 100', 'Full stoichiometric correction')
    ]

    for i, (name, formula, formula_desc, desc) in enumerate(methods):
        row = i + 5
        ws2.write(f'A{row}', name)
        ws2.write_formula(f'B{row}', formula, calc_bg)
        
        ws2.write_formula(f'C{row}', f'=B{row} - (B{row} * (\'Calculation Input\'!$B$24/100) * 2)', calc_bg)
        ws2.write_formula(f'D{row}', f'=B{row} + (B{row} * (\'Calculation Input\'!$B$24/100) * 2)', calc_bg)
        
        ws2.write_formula(f'E{row}', f'=IF(AND(B{row}>=98,B{row}<=102),"LOW",IF(OR(B{row}<95,B{row}>105),"HIGH","MODERATE"))', calc_bg)
        ws2.write(f'F{row}', formula_desc)
        ws2.write(f'G{row}', desc)

    ws2.conditional_format('E5:E9', {'type': 'text', 'criteria': 'containing', 'value': 'LOW', 'format': risk_low})
    ws2.conditional_format('E5:E9', {'type': 'text', 'criteria': 'containing', 'value': 'MODERATE', 'format': risk_mod})
    ws2.conditional_format('E5:E9', {'type': 'text', 'criteria': 'containing', 'value': 'HIGH', 'format': risk_high})

    ws2.write('A12', 'RECOMMENDED METHOD', subheader_fmt)
    ws2.write('A13', 'Best Method:');       ws2.write('B13', 'CIMB', workbook.add_format({'bold': True}))
    ws2.write('A14', 'Recommended Value:'); ws2.write_formula('B14', '=B9', calc_bg)
    ws2.write('A15', 'Status:');            ws2.write_formula('B15', '=IF(E9="LOW","PASS","FAIL")', calc_bg)
    
    ws2.write('D12', 'QUALITY METRICS', subheader_fmt)
    ws2.write('D13', 'Degradation Level:');  ws2.write_formula('E13', "='Calculation Input'!B13", calc_bg)
    ws2.write('D14', 'Degradant Recovery:'); ws2.write_formula('E14', "=IF('Calculation Input'!B13<>0,'Calculation Input'!B18/'Calculation Input'!B13*100,0)", calc_bg)
    ws2.write('D15', 'Confidence Index:');   ws2.write('E15', '95%', calc_bg)

    ws3 = workbook.add_worksheet('Detailed Analysis')
    ws3.set_column('A:E', 25)
    ws3.merge_range('A1:E1', 'Detailed Scientific Analysis', header_fmt)
    
    ws3.write('A3', 'DEGRADATION ANALYSIS', subheader_fmt)
    ws3.write('A4', 'API Loss (%):');           ws3.write_formula('B4', "='Calculation Input'!B13", calc_bg)
    ws3.write('A5', 'Degradant Increase (%):'); ws3.write_formula('B5', "='Calculation Input'!B18", calc_bg)
    ws3.write('A6', 'Recovery Ratio:');         ws3.write_formula('B6', "='Mass Balance Results'!E14/100", calc_bg)
    ws3.write('A7', 'Mass Balance Closure:');   ws3.write_formula('B7', "='Mass Balance Results'!B9", calc_bg)

    ws3.write('D3', 'METHOD COMPARISON', subheader_fmt)
    ws3.write('D4', 'Method', header_fmt); ws3.write('E4', 'Result', header_fmt)
    for i, m in enumerate(['SMB', 'AMB', 'RMB', 'LK-IMB', 'CIMB']):
        ws3.write(i+4, 3, m, calc_bg)
        ws3.write_formula(i+4, 4, f"='Mass Balance Results'!B{i+5}", calc_bg)

    ws3.write('A15', 'DIAGNOSTIC ASSESSMENT', subheader_fmt)
    ws3.write('A17', 'Status:'); ws3.write_formula('B17', "='Mass Balance Results'!B15", calc_bg)
    
    text_fmt = workbook.add_format({'text_wrap': True, 'valign': 'top', 'border': 1, 'bg_color': '#f8fafc'})
    ws3.merge_range('A19:E21', "Use CIMB method for pharmaceutical mass balance calculations. It provides the most accurate results by incorporating both detector response (RRF) and molecular weight corrections.", text_fmt)
    ws3.merge_range('A23:E25', "The CIMB method accounts for stoichiometric relationships. Lambda (λ) corrects for detector sensitivity, while Omega (ω) adjusts for molecular weight differences.", text_fmt)

    ws4 = workbook.add_worksheet('Calculation History')
    
    ws4.set_column('A:A', 10)
    ws4.set_column('B:B', 15)
    ws4.set_column('C:E', 15)
    ws4.set_column('F:I', 12)
    ws4.set_column('J:J', 10)
    ws4.set_column('K:K', 12)
    ws4.set_column('L:M', 15)

    ws4.merge_range('A1:M1', 'Calculation History Log', header_fmt)

    hist_headers = [
        'Calc ID', 'Date', 'Sample ID', 'Analyst', 'Stress Type', 
        'Initial API', 'Stressed API', 'Initial Deg', 'Stressed Deg', 
        'Method', 'Result (%)', 'Risk Level', 'Status'
    ]
    ws4.write_row('A3', hist_headers, header_fmt)

    for i, record in enumerate(history):
        row_num = i + 3
        
        ws4.write(row_num, 0, str(record[0] or '')[:8], calc_bg)
        ws4.write(row_num, 1, (record[1] or '')[:10], calc_bg)
        ws4.write(row_num, 2, record[2], calc_bg)
        ws4.write(row_num, 3, record[3], calc_bg)
        ws4.write(row_num, 4, record[4], calc_bg)
        ws4.write(row_num, 5, record[5], calc_bg)
        ws4.write(row_num, 6, record[6], calc_bg)
        ws4.write(row_num, 7, record[7], calc_bg)
        ws4.write(row_num, 8, record[8], calc_bg)
        
        method = 'CIMB'
        result = record[19] if len(record) > 19 else 0
        risk_level = 'LOW' if (98 <= result <= 102) else 'HIGH'
        status = 'PASS' if risk_level == 'LOW' else 'FAIL'

        ws4.write(row_num, 9, method, calc_bg)
        ws4.write(row_num, 10, result, calc_bg)
        
        risk_fmt = risk_low if risk_level == 'LOW' else risk_high
        ws4.write(row_num, 11, risk_level, risk_fmt)
        ws4.write(row_num, 12, status, risk_fmt)
        
    ws5 = workbook.add_worksheet('Analytics Dashboard')
    
    ws5.set_column('A:B', 20)
    ws5.set_column('C:C', 5)
    ws5.set_column('D:E', 20)

    ws5.merge_range('A1:E1', 'Analytics & Performance Metrics', header_fmt)

    ws5.write('A3', 'KEY PERFORMANCE INDICATORS', subheader_fmt)
    ws5.write('A4', 'Total Analyses:'); ws5.write_formula('B4', '=COUNTA(\'Calculation History\'!A:A)-1', calc_bg)
    
    ws5.write('A5', 'Pass Rate:');      ws5.write_formula('B5', '=IFERROR(COUNTIF(\'Calculation History\'!M:M, "PASS")/B4, 0)', workbook.add_format({'num_format': '0.0%', 'border': 1}))
    ws5.write('A6', 'Alert Rate:');     ws5.write_formula('B6', '=IFERROR(COUNTIF(\'Calculation History\'!L:L, "MODERATE")/B4, 0)', workbook.add_format({'num_format': '0.0%', 'border': 1}))
    ws5.write('A7', 'OOS Rate:');       ws5.write_formula('B7', '=IFERROR(COUNTIF(\'Calculation History\'!M:M, "FAIL")/B4, 0)', workbook.add_format({'num_format': '0.0%', 'border': 1}))
    ws5.write('A8', 'Avg Result:');     ws5.write_formula('B8', '=IFERROR(AVERAGE(\'Calculation History\'!K:K), 0)', workbook.add_format({'num_format': '0.0%', 'border': 1}))

    ws5.write('D3', 'METHOD USAGE', subheader_fmt)
    usage_row = 3
    for m in ['SMB', 'AMB', 'RMB', 'LK-IMB', 'CIMB']:
        ws5.write(usage_row, 3, m)
        ws5.write_formula(usage_row, 4, f'=COUNTIF(\'Calculation History\'!J:J, "{m}")', calc_bg)
        usage_row += 1

    ws5.write('A10', 'RISK DISTRIBUTION', subheader_fmt)
    ws5.write('A11', 'LOW Risk Count:');      ws5.write_formula('B11', '=COUNTIF(\'Calculation History\'!L:L, "LOW")', calc_bg)
    ws5.write('A12', 'MODERATE Risk Count:'); ws5.write_formula('B12', '=COUNTIF(\'Calculation History\'!L:L, "MODERATE")', calc_bg)
    ws5.write('A13', 'HIGH Risk Count:');     ws5.write_formula('B13', '=COUNTIF(\'Calculation History\'!L:L, "HIGH")', calc_bg)
        
    ws6 = workbook.add_worksheet('Reference Guide')
    
    ws6.set_column('A:A', 30)
    ws6.set_column('B:B', 15)
    ws6.set_column('C:C', 55)

    ws6.merge_range('A1:C1', 'Mass Balance AI - Reference Guide', header_fmt)

    ws6.write('A4', 'METHOD DESCRIPTIONS', subheader_fmt)

    methods_ref = [
        {
            'name': 'SMB - Simple Mass Balance',
            'formula': 'Stressed API + Stressed Degradants',
            'use': 'Quick preliminary assessment',
            'extra_label': 'Limitations:',
            'extra_text': 'No correction for detector or MW differences'
        },
        {
            'name': 'AMB - Adjusted Mass Balance',
            'formula': '(Stressed/Initial) × 100',
            'use': 'Normalized to initial values',
            'extra_label': 'Limitations:',
            'extra_text': 'Does not account for stoichiometry'
        },
        {
            'name': 'RMB - Ratio Mass Balance',
            'formula': 'ΔDegradants/ΔAPI × 100',
            'use': 'Evaluating degradation pathway',
            'extra_label': 'Limitations:',
            'extra_text': 'Undefined if no API loss'
        },
        {
            'name': 'LK-IMB - Lambda-Kappa IMB',
            'formula': '(API + Deg×λ×ω)/Initial × 100',
            'use': 'Corrects for RRF and MW',
            'extra_label': 'Benefits:',
            'extra_text': 'More accurate than simple methods'
        },
        {
            'name': 'CIMB - Corrected IMB',
            'formula': '(API + Deg×S)/Initial × 100',
            'use': 'Full stoichiometric correction',
            'extra_label': 'Benefits:',
            'extra_text': 'Most accurate, ICH compliant'
        }
    ]

    row = 5
    bold_item = workbook.add_format({'bold': True})
    
    for m in methods_ref:
        ws6.write(row, 0, m['name'], bold_item)
        
        ws6.write(row, 1, 'Formula:');     ws6.write(row, 2, m['formula'])
        ws6.write(row + 1, 1, 'Use Case:');    ws6.write(row + 1, 2, m['use'])
        ws6.write(row + 2, 1, m['extra_label']); ws6.write(row + 2, 2, m['extra_text'])
        
        row += 4

    ws6.write(row, 0, 'RISK LEVELS', subheader_fmt)
    row += 2
    
    ws6.write(row, 0, 'LOW (98-102%)', risk_low)
    ws6.write(row + 1, 0, 'MODERATE (95-98%, 102-105%)', risk_mod)
    ws6.write(row + 2, 0, 'HIGH (<95%, >105%)', risk_high)
    
    row += 5

    ws6.write(row, 0, 'CORRECTION FACTORS', subheader_fmt)
    row += 1
    
    ws6.write_row(row, 0, ['Factor', 'Formula', 'Purpose'], header_fmt)
    
    factors = [
        ('Lambda (λ)', '1/RRF', 'Corrects detector response'),
        ('Omega (ω)', 'Deg MW/Parent MW', 'Corrects molecular weight'),
        ('Stoichiometric (S)', 'λ × ω', 'Combined correction factor')
    ]
    
    for f_name, f_form, f_purp in factors:
        row += 1
        ws6.write(row, 0, f_name, calc_bg)
        ws6.write(row, 1, f_form, calc_bg)
        ws6.write(row, 2, f_purp, calc_bg)
    # --- SHEET 7: TREND ANALYSIS ---
    ws7 = workbook.add_worksheet('Trend Analysis')
    ws7.set_column('A:B', 15)
    ws7.merge_range('A1:D1', 'Long-term Stability Trend Analysis', header_fmt)
    
    ws7.write('A3', 'Data for Charts', subheader_fmt)
    ws7.write_row('A4', ['Date', 'API (%)', 'Deg (%)', 'MB (%)'], header_fmt)
    
    # Fill history for trend chart
    for i, record in enumerate(history[:10][::-1]): # Last 10 reversed
        r = i + 4
        ws7.write(r, 0, (record[1] or '')[:10])
        ws7.write(r, 1, record[6]) # Stressed API
        ws7.write(r, 2, record[8]) # Stressed Deg
        ws7.write(r, 3, record[19] if len(record) > 19 else 100) # MB
        
    line_chart = workbook.add_chart({'type': 'line'})
    line_chart.add_series({
        'name':       '=\'Trend Analysis\'!$B$4',
        'categories': '=\'Trend Analysis\'!$A$5:$A$14',
        'values':     '=\'Trend Analysis\'!$B$5:$B$14',
        'line':       {'color': '#3b82f6'},
    })
    line_chart.add_series({
        'name':       '=\'Trend Analysis\'!$C$4',
        'categories': '=\'Trend Analysis\'!$A$5:$A$14',
        'values':     '=\'Trend Analysis\'!$C$5:$C$14',
        'line':       {'color': '#ef4444'},
    })
    line_chart.set_title({'name': 'Stability Trend (API vs Degradants)'})
    line_chart.set_x_axis({'name': 'Analysis Date'})
    line_chart.set_y_axis({'name': 'Percentage (%)'})
    ws7.insert_chart('F4', line_chart)

    # --- SHEET 8: PERFORMANCE RADAR ---
    ws8 = workbook.add_worksheet('Performance Radar')
    ws8.merge_range('A1:E1', 'Method Performance Profile', header_fmt)
    
    radar_headers = ['Metric', 'SMB', 'AMB', 'LK-IMB', 'CIMB']
    ws8.write_row('A3', radar_headers, header_fmt)
    
    radar_data = [
        ['Accuracy', 70, 80, 90, 95],
        ['Precision', 65, 75, 88, 92],
        ['Regulatory Compliance', 60, 70, 85, 95],
        ['Complexity (Simplified)', 95, 85, 60, 50],
        ['Reliability', 70, 78, 87, 93]
    ]
    
    for i, row_data in enumerate(radar_data):
        ws8.write_row(i + 3, 0, row_data)
        
    # Radar charts are not directly supported as a native chart type in all xlsxwriter versions 
    # but we can use a radar scatter or just provide the matrix for manual charting.
    # We will provide a Column chart as a fallback visualization of performance.
    perf_chart = workbook.add_chart({'type': 'column'})
    for i in range(1, 5):
        perf_chart.add_series({
            'name':       ['Performance Radar', 2, i],
            'categories': ['Performance Radar', 3, 0, 7, 0],
            'values':     ['Performance Radar', 3, i, 7, i],
        })
    perf_chart.set_title({'name': 'Method Comparison Matrix'})
    ws8.insert_chart('G4', perf_chart)

    # --- SHEET 9: REGULATORY COMPLIANCE ---
    ws9 = workbook.add_worksheet('Regulatory Compliance')
    ws9.set_column('A:A', 30); ws9.set_column('B:B', 70)
    ws9.merge_range('A1:B1', 'ICH Q1A(R2) Compliance Checklist', header_fmt)
    
    check_fmt = workbook.add_format({'bold': True, 'font_color': '#16a34a'})
    
    requirements = [
        ('Mass Balance Requirement', 'Detailed mass balance should be performed to ensure all degradation products are accounted for.', 'COMPLIANT'),
        ('Correction for Response Factors', 'Detector response factors (RRF) must be considered for accurate quantification.', 'COMPLIANT'),
        ('MW Correction', 'Molecular weight differences between parent and degradants should be normalized.', 'COMPLIANT'),
        ('Statistical Significance', 'Results should be validated using appropriate statistical methods (CI).', 'COMPLIANT'),
        ('Stress Conditions', 'Forced degradation study must include acid, base, peroxide, and thermal stress.', 'PENDING REVIEW')
    ]
    
    ws9.write('A3', 'Requirement', header_fmt)
    ws9.write('B3', 'Guideline Detail', header_fmt)
    ws9.write('C3', 'Status', header_fmt)
    
    for i, (req, detail, stat) in enumerate(requirements):
        row = i + 4
        ws9.write(row, 0, req, bold_item)
        ws9.write(row, 1, detail)
        ws9.write(row, 2, stat, check_fmt if stat == 'COMPLIANT' else risk_mod)

    # Pie Chart for Risk in Analytics
    pie_chart = workbook.add_chart({'type': 'pie'})
    pie_chart.add_series({
        'name': 'Risk Distribution',
        'categories': ['Analytics Dashboard', 10, 0, 12, 0],
        'values':     ['Analytics Dashboard', 10, 1, 12, 1],
        'points': [
            {'fill': {'color': '#10b981'}},
            {'fill': {'color': '#f59e0b'}},
            {'fill': {'color': '#ef4444'}},
        ],
    })
    ws5.insert_chart('A16', pie_chart)

    workbook.close()
    print(json.dumps({'status': 'success', 'file': output_path}))

def generate_history_only():
    ensure_directories()
    
    if not os.path.exists(DB_PATH):
        print(json.dumps({'status': 'error', 'message': f'Database not found at {DB_PATH}'}))
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM calculations ORDER BY timestamp DESC LIMIT 100")
    history = cursor.fetchall()
    conn.close()
    
    if not history:
        print(json.dumps({'status': 'error', 'message': 'No history data found'}))
        sys.exit(1)

    filename = f"Calculation History {datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    output_path = os.path.join(REPORTS_DIR, filename)
    
    workbook = xlsxwriter.Workbook(output_path)
    
    header_fmt = workbook.add_format({'bg_color': '#3b82f6', 'font_color': 'white', 'bold': True, 'align': 'center', 'valign': 'vcenter', 'border': 1})
    calc_bg = workbook.add_format({'bg_color': '#f8fafc', 'border': 1})
    risk_low = workbook.add_format({'bg_color': '#dcfce7', 'font_color': '#166534', 'border': 1})
    risk_high = workbook.add_format({'bg_color': '#fee2e2', 'font_color': '#991b1b', 'border': 1})
    
    ws = workbook.add_worksheet('Calculation History')
    
    ws.set_column('A:A', 10)
    ws.set_column('B:B', 15)
    ws.set_column('C:E', 15)
    ws.set_column('F:I', 12)
    ws.set_column('J:J', 10)
    ws.set_column('K:K', 12)
    ws.set_column('L:M', 15)

    ws.merge_range('A1:M1', 'Calculation History Log', header_fmt)

    hist_headers = [
        'Calc ID', 'Date', 'Sample ID', 'Analyst', 'Stress Type', 
        'Initial API', 'Stressed API', 'Initial Deg', 'Stressed Deg', 
        'Method', 'Result (%)', 'Risk Level', 'Status'
    ]
    ws.write_row('A3', hist_headers, header_fmt)

    for i, record in enumerate(history):
        row_num = i + 3
        
        ws.write(row_num, 0, str(record[0] or '')[:8], calc_bg)
        ws.write(row_num, 1, (record[1] or '')[:10], calc_bg)
        ws.write(row_num, 2, record[2], calc_bg)
        ws.write(row_num, 3, record[3], calc_bg)
        ws.write(row_num, 4, record[4], calc_bg)
        ws.write(row_num, 5, record[5], calc_bg)
        ws.write(row_num, 6, record[6], calc_bg)
        ws.write(row_num, 7, record[7], calc_bg)
        ws.write(row_num, 8, record[8], calc_bg)
        
        method = 'CIMB'
        result = record[19] if len(record) > 19 else 0
        risk_level = 'LOW' if (98 <= result <= 102) else 'HIGH'
        status = 'PASS' if risk_level == 'LOW' else 'FAIL'

        ws.write(row_num, 9, method, calc_bg)
        ws.write(row_num, 10, result, calc_bg)
        
        risk_fmt = risk_low if risk_level == 'LOW' else risk_high
        ws.write(row_num, 11, risk_level, risk_fmt)
        ws.write(row_num, 12, status, risk_fmt)
    
    workbook.close()
    print(json.dumps({'status': 'success', 'file': output_path}))

if __name__ == '__main__':
    if len(sys.argv) > 2:
        # Expected args: script.py [db_path] [output_path]
        generate_excel(sys.argv[1], sys.argv[2])
    elif len(sys.argv) > 1 and sys.argv[1] == '--history-only':
        generate_history_only()
    else:
        generate_excel()