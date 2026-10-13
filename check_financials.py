import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False
wb = excel.Workbooks.Open(file_path, UpdateLinks=0, ReadOnly=True)

with io.open("d:/DIA+/output.txt", "w", encoding="utf-8") as f:
    try:
        f.write("--- DIA_Hiệu Quả TC ---\n")
        ws_hq = wb.Sheets('DIA_Hiệu Quả TC')
        # Check EBITDA
        for r in range(230, 245):
            if ws_hq.Cells(r, 2).Value == 'EBITDA':
                f.write(f"Row {r}: EBITDA = {[ws_hq.Cells(r, c).Value for c in range(3, 6)]}\n")
        
        # Check Cash Flow
        for r in range(240, 260):
            val = ws_hq.Cells(r, 2).Value
            if val in ['Dòng tiền từ hoạt động kinh doanh', 'Dòng tiền đầu tư ban đầu', 'Dòng tiền ròng tổng hợp (IRR)']:
                f.write(f"Row {r}: {val} = {[ws_hq.Cells(r, c).Value for c in range(3, 7)]}\n")

        f.write("--- DIA_Tóm Tắt ---\n")
        ws_tt = wb.Sheets('DIA_Tóm Tắt')
        for r in range(295, 305):
            for c in range(5, 10):
                val = ws_tt.Cells(r, c).Value
                if val in ['NPV', 'IRR', 'Nhu cầu vốn', 'Vốn gọi đề xuất']:
                    f.write(f"Row {r}, Col {c}: {val} = {ws_tt.Cells(r, c+1).Value}\n")

    finally:
        wb.Close(False)
        excel.Quit()
