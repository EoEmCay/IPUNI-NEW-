import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with open(r'd:\DIA+\find_real_ncf.txt', 'w', encoding='utf-8') as f:
        # Search the entire column B for "Dòng tiền ròng"
        for r in range(1, 150):
            val = str(ws_fin.Cells(r, 2).Value).strip()
            if 'Dòng tiền ròng' in val or 'Dòng tiền lũy kế' in val:
                c4 = ws_fin.Cells(r, 4).Value
                c5 = ws_fin.Cells(r, 5).Value
                f.write(f"Row {r}: {val} -> Col4:{c4}, Col5:{c5}\n")
                
        # Also check what DIA_Tóm Tắt is linking to for "Nhu cầu vốn"
        ws_dash = wb.Sheets('DIA_Tóm Tắt')
        for r in range(1, 20):
            val = str(ws_dash.Cells(r, 2).Value)
            if 'Nhu cầu' in val:
                f.write(f"Dashboard Nhu cầu vốn (Row {r}) formula: {ws_dash.Cells(r, 4).Formula}\n")
            elif 'Vốn gọi' in val:
                f.write(f"Dashboard Vốn gọi (Row {r}) formula: {ws_dash.Cells(r, 4).Formula}\n")
            elif 'IRR' in val or 'Hoàn vốn' in val:
                f.write(f"Dashboard {val} (Row {r}) formula: {ws_dash.Cells(r, 9).Formula}\n")

finally:
    wb.Close(False)
    excel.Quit()
