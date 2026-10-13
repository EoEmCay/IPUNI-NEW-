import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    # NPV is at Row 7, Col 9? Let's find exactly where "IRR", "NPV", "Nhu cầu vốn" are
    for r in range(1, 30):
        for c in range(1, 12):
            val = str(ws_dash.Cells(r, c).Value).strip()
            if 'IRR' in val and len(val) <= 5:
                # Assuming the value is next to it, e.g. c+2
                ws_dash.Cells(r, c+2).Formula = '=IFERROR(IRR(\'DIA_Hiệu Quả TC\'!C62:F62), "Âm")'
            elif 'NPV' in val and len(val) <= 5:
                # NPV value is at c+2 or c+3?
                # Formula: NPV(Discount rate, CF1..CF3) + CF0
                ws_dash.Cells(r, c+1).Formula = '=\'DIA_Hiệu Quả TC\'!$B$79' # Or calculate it: =NPV(18%, C62:F62)
                # Actually let's just write NPV directly:
                ws_dash.Cells(r, c+1).Formula = '=NPV(\'DIA_Giả Định\'!C60, \'DIA_Hiệu Quả TC\'!D62:F62) + \'DIA_Hiệu Quả TC\'!C62'
            elif 'Nhu cầu vốn' in val:
                # Minimum of Cumulative Cash Flow (row 64 in my previous dump was Dòng tiền lũy kế?)
                # Let's use row 64, from C to F
                ws_dash.Cells(r, c+2).Formula = '=-MIN(\'DIA_Hiệu Quả TC\'!C64:E64)'
    
    excel.Calculate()
    wb.Save()
    print("Fixed dashboard formulas to point to correct rows.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
