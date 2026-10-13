import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with open(r'd:\DIA+\find_250.txt', 'w', encoding='utf-8') as f:
        for r in range(250, 260):
            v2 = ws_fin.Cells(r, 2).Value
            v3 = ws_fin.Cells(r, 3).Value
            v4 = ws_fin.Cells(r, 4).Value
            v5 = ws_fin.Cells(r, 5).Value
            f.write(f"R{r}: {v2} | {v3} | {v4} | {v5}\n")

finally:
    wb.Close(False)
    excel.Quit()
