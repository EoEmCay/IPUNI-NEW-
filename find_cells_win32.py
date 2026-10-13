import win32com.client
import os

excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False
file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
wb = excel.Workbooks.Open(file_path)

try:
    ws_cp = wb.Sheets('DIA_Chi Phí')
    print("--- DIA_Chi Phí ---")
    for r in range(10, 50):
        val = ws_cp.Cells(r, 2).Value
        if val and isinstance(val, str) and 'Marketing' in val:
            print(f"Row {r}: {val}, Col C: {ws_cp.Cells(r, 3).Value}, Col D: {ws_cp.Cells(r, 4).Value}")

    ws_tt = wb.Sheets('DIA_Tóm Tắt')
    print("--- DIA_Tóm Tắt ---")
    for r in range(1, 20):
        for c in range(1, 10):
            if ws_tt.Cells(r, c).Value == 'IRR':
                print(f"IRR found at Row {r}, Col {c}. Adjacent cell: {ws_tt.Cells(r, c+1).Value}")

    ws_hq = wb.Sheets('DIA_Hiệu Quả TC')
    print("--- DIA_Hiệu Quả TC ---")
    for r in range(30, 60):
        val = ws_hq.Cells(r, 2).Value
        if val == 'Dòng tiền đầu tư ban đầu' or val == 'Dòng tiền từ hoạt động kinh doanh':
            print(f"Row {r}: {val}")
            print(f"Values: {[ws_hq.Cells(r, c).Value for c in range(3, 8)]}")

finally:
    wb.Close(False)
    excel.Quit()
