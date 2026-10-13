import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_gd = wb.Sheets('DIA_Giả Định')
    ws_cp = wb.Sheets('DIA_Chi Phí')
    
    with io.open(r'd:\DIA+\coords_out.txt', 'w', encoding='utf-8') as f:
        f.write("--- DIA_Giả Định ---\n")
        # In DIA_Giả Định, columns for Year 1, 2, 3 base are typically G, H, I (7, 8, 9). 
        # But we saw from the earlier dump they might be D, E, F (4,5,6) or H, I, J.
        # Let's just print cols 3 to 10
        for r in range(1, 150):
            val = ws_gd.Cells(r, 1).Value
            if not val: val = ws_gd.Cells(r, 2).Value
            if not val: val = ws_gd.Cells(r, 3).Value
            if val and isinstance(val, str):
                if any(k in val for k in ['Tổng người dùng đăng ký', 'Số bệnh viện', 'Số phòng khám', 'Bệnh nhân trung bình']):
                    vals = [str(ws_gd.Cells(r, c).Value) for c in range(3, 12)]
                    f.write(f"Row {r}: {val} -> Cols 3-11: {vals}\n")

        f.write("--- DIA_Chi Phí ---\n")
        for r in range(1, 100):
            val = ws_cp.Cells(r, 2).Value
            if not val: val = ws_cp.Cells(r, 3).Value
            if val and isinstance(val, str) and 'Marketing' in val:
                vals = [str(ws_cp.Cells(r, c).Value) for c in range(3, 12)]
                f.write(f"Row {r}: {val} -> Cols 3-11: {vals}\n")

finally:
    wb.Close(False)
    excel.Quit()
