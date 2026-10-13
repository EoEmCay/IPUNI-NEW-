import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    with io.open(r'd:\DIA+\dash_formula.txt', 'w', encoding='utf-8') as f:
        for r in range(10, 20):
            val2 = str(ws_dash.Cells(r, 2).Value).strip()
            val7 = str(ws_dash.Cells(r, 7).Value).strip()
            
            f.write(f"R{r} C2: {val2} | C4 Formula: {ws_dash.Cells(r, 4).Formula}\n")
            f.write(f"R{r} C7: {val7} | C9 Formula: {ws_dash.Cells(r, 9).Formula}\n")
            
            # Let's get the formula for C7 (which is G)
            f.write(f"R{r} C7 Formula: {ws_dash.Cells(r, 7).Formula}\n")

finally:
    wb.Close(False)
    excel.Quit()
