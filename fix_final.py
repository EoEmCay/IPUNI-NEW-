import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    ws_fin  = wb.Sheets('DIA_Hiệu Quả TC')
    ws_gd   = wb.Sheets('DIA_Giả Định')

    # --- Fix NPV at G7 ---
    # NPV is already calculated correctly at DIA_Hiệu Quả TC B70, just link to it
    ws_dash.Range("G7").Formula = "='DIA_Hiệu Quả TC'!B70"
    ws_dash.Range("G7").NumberFormat = '#,##0 [$₫-42A];[Red]-#,##0 [$₫-42A]'

    # --- Fix IRR at I7 ---  
    # IRR is already calculated correctly at DIA_Hiệu Quả TC B71, link to it
    ws_dash.Range("I7").Formula = "=IFERROR('DIA_Hiệu Quả TC'!B71, \"Âm\")"
    ws_dash.Range("I7").NumberFormat = "0.0%"

    # --- Fix Hoàn vốn (Payback Period) at G8 ---
    # Hoàn vốn is at B72
    ws_dash.Range("G8").Formula = "='DIA_Hiệu Quả TC'!B72"
    ws_dash.Range("G8").NumberFormat = "0.0"

    # --- Fix Nhu cầu vốn at G13 ---
    # MIN of cumulative discounted CF (row 64 = Dòng tiền lũy kế dự án, minus to get positive)
    ws_dash.Range("G13").Formula = "=MAX(0, -MIN('DIA_Hiệu Quả TC'!C64:E64))"
    ws_dash.Range("G13").NumberFormat = '#,##0 [$₫-42A]'

    # --- Fix Vốn gọi đề xuất at I13 ---
    ws_dash.Range("I13").Formula = "=ROUNDUP(G13 / 100000000, 0) * 100000000"
    ws_dash.Range("I13").NumberFormat = '#,##0 [$₫-42A]'
    
    # --- Fix Doanh thu hòa vốn at I8 ---
    # Use DIA_Hiệu Quả TC B80 which had the value 4.1T from screenshot
    ws_dash.Range("I8").Formula = "='DIA_Hiệu Quả TC'!B80"
    ws_dash.Range("I8").NumberFormat = '#,##0 [$₫-42A]'

    excel.Calculate()
    wb.Save()
    
    # Verify
    with io.open(r'd:\DIA+\verify_final.txt', 'w', encoding='utf-8') as f:
        f.write(f"NPV (G7): {ws_dash.Range('G7').Value:,.0f}\n")
        f.write(f"IRR (I7): {ws_dash.Range('I7').Value}\n")
        f.write(f"Hoàn vốn (G8): {ws_dash.Range('G8').Value}\n")
        f.write(f"Nhu cầu vốn (G13): {ws_dash.Range('G13').Value:,.0f}\n")
        f.write(f"Vốn gọi đề xuất (I13): {ws_dash.Range('I13').Value:,.0f}\n")
    
    print("All fixed. Verifying output...")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
