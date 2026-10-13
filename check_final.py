import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

with io.open("d:/DIA+/output_final.txt", "w", encoding="utf-8") as f:
    try:
        wb = excel.Workbooks.Open(file_path, UpdateLinks=0, ReadOnly=True)
        ws_tt = wb.Sheets('DIA_Tóm Tắt')
        for r in range(295, 305):
            for c in range(5, 10):
                val = ws_tt.Cells(r, c).Value
                if val in ['NPV', 'IRR', 'Nhu cầu vốn', 'Vốn gọi đề xuất']:
                    f.write(f"Row {r}, Col {c}: {val} = {ws_tt.Cells(r, c+1).Text} (Formula: {ws_tt.Cells(r, c+1).Formula})\n")
    finally:
        wb.Close(False)
        excel.Quit()
