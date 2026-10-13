import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    # NPV value is at G7
    ws_dash.Range("G7").Formula = "=NPV('DIA_Giả Định'!C60, 'DIA_Hiệu Quả TC'!D62:F62) + 'DIA_Hiệu Quả TC'!C62"
    
    # IRR value is at I7
    ws_dash.Range("I7").Formula = '=IFERROR(IRR(\'DIA_Hiệu Quả TC\'!C62:F62), "Âm")'
    ws_dash.Range("I7").NumberFormat = "0.0%"
    
    # Nhu cầu vốn value is at G13
    ws_dash.Range("G13").Formula = "=-MIN('DIA_Hiệu Quả TC'!C64:F64)"
    
    # Vốn gọi đề xuất is at I13
    ws_dash.Range("I13").Formula = "=ROUNDUP(G13 / 100000000, 0) * 100000000"
    
    excel.Calculate()
    wb.Save()
    print("Fixed exact cells in dashboard.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
