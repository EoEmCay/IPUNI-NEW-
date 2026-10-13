import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with io.open(r'd:\DIA+\verify_cf.txt', 'w', encoding='utf-8') as f:
        # Check cash flows row 53
        cf0 = ws_fin.Cells(53, 2).Value
        cf1 = ws_fin.Cells(53, 3).Value
        cf2 = ws_fin.Cells(53, 4).Value
        cf3 = ws_fin.Cells(53, 5).Value
        
        f.write(f"CF0: {cf0}\n")
        f.write(f"CF1: {cf1}\n")
        f.write(f"CF2: {cf2}\n")
        f.write(f"CF3: {cf3}\n")
        
        # Check EBITDA to see if terminal value can be positive
        ebitda_y3 = ws_fin.Cells(45, 5).Value
        f.write(f"EBITDA Year 3 (Row 45): {ebitda_y3}\n")
        term_val = ws_fin.Cells(54, 5).Value
        f.write(f"Terminal Value Year 3: {term_val}\n")
        
        # Check Total CF row 55 or 60? Let's print rows 52 to 62
        for r in range(52, 65):
            f.write(f"Row {r}: {ws_fin.Cells(r, 2).Value} | {ws_fin.Cells(r, 3).Value} | {ws_fin.Cells(r, 4).Value} | {ws_fin.Cells(r, 5).Value}\n")

finally:
    wb.Close(False)
    excel.Quit()
