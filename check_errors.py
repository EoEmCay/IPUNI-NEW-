import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    with io.open(r'd:\DIA+\output_errors.txt', 'w', encoding='utf-8') as f:
        f.write("--- DIA_Hiệu Quả TC Cash Flows ---\n")
        for r in range(50, 65):
            val = str(ws_fin.Cells(r, 2).Value).strip()
            if val and val != 'None':
                c0 = ws_fin.Cells(r, 2).Value
                c1 = ws_fin.Cells(r, 3).Value
                c2 = ws_fin.Cells(r, 4).Value
                c3 = ws_fin.Cells(r, 5).Value
                c4 = ws_fin.Cells(r, 6).Value
                f.write(f"Row {r}: {c0} | {c1} | {c2} | {c3} | {c4}\n")

        ws_tomtat = wb.Sheets('DIA_Tóm Tắt')
        f.write("--- DIA_Tóm Tắt ---\n")
        for r in range(1, 20):
            c2 = ws_tomtat.Cells(r, 2).Value
            c4 = ws_tomtat.Cells(r, 4).Value
            c7 = ws_tomtat.Cells(r, 7).Value
            c9 = ws_tomtat.Cells(r, 9).Value
            f.write(f"Row {r}: {c2}={c4} | {c7}={c9}\n")

        # Also dump Giả Định row 6 to see what value the formula computed
        ws_gd = wb.Sheets('DIA_Giả Định')
        f.write("--- DIA_Giả Định ---\n")
        f.write(f"Row 6 Formula: {ws_gd.Cells(6, 7).Formula} | {ws_gd.Cells(6, 8).Formula} | {ws_gd.Cells(6, 9).Formula}\n")
        f.write(f"Row 6 Value: {ws_gd.Cells(6, 7).Value} | {ws_gd.Cells(6, 8).Value} | {ws_gd.Cells(6, 9).Value}\n")

finally:
    wb.Close(False)
    excel.Quit()
