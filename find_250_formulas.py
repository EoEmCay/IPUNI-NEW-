import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with open(r'd:\DIA+\find_250_formulas.txt', 'w', encoding='utf-8') as f:
        for r in range(252, 256):
            f2 = ws_fin.Cells(r, 2).Formula
            f3 = ws_fin.Cells(r, 3).Formula
            f4 = ws_fin.Cells(r, 4).Formula
            f5 = ws_fin.Cells(r, 5).Formula
            f6 = ws_fin.Cells(r, 6).Formula
            f.write(f"R{r}: C3:{f3} | C4:{f4} | C5:{f5} | C6:{f6}\n")

finally:
    wb.Close(False)
    excel.Quit()
