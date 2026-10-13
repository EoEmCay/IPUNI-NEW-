import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with open(r'd:\DIA+\fin_rows.txt', 'w', encoding='utf-8') as f:
        for r in range(40, 60):
            val = str(ws_fin.Cells(r, 2).Value).strip()
            if val and val != 'None':
                f.write(f"R{r}: {val} -> Yr0: {ws_fin.Cells(r, 5).Value}, Yr1: {ws_fin.Cells(r, 7).Value}\n")

finally:
    wb.Close(False)
    excel.Quit()
