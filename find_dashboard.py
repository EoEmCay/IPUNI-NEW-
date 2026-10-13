import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    with io.open(r'd:\DIA+\find_real_ncf.txt', 'w', encoding='utf-8') as f:
        f.write("--- DIA_Tóm Tắt Formulas ---\n")
        for r in range(1, 30):
            val = str(ws_dash.Cells(r, 2).Value).strip()
            f4 = ws_dash.Cells(r, 4).Formula
            f9 = ws_dash.Cells(r, 9).Formula
            val7 = str(ws_dash.Cells(r, 7).Value).strip()
            
            f.write(f"R{r}: C2='{val}' C4='{f4}' | C7='{val7}' C9='{f9}'\n")

finally:
    wb.Close(False)
    excel.Quit()
