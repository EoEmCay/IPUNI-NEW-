import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0, ReadOnly=True)
    ws_gd = wb.Sheets('DIA_Giả Định')
    
    print("--- User Assumptions ---")
    for r in range(60, 100):
        val = ws_gd.Cells(r, 3).Value
        if val and isinstance(val, str):
            if any(k in val for k in ['Tổng người dùng đăng ký', 'Số bệnh viện cuối năm', 'Số phòng khám cuối năm', 'Bệnh nhân trung bình']):
                # Print the Base Scenario (Cơ sở) values for Year 1, 2, 3
                # Col G, H, I usually (Wait, let's print all values to be sure)
                row_vals = [str(ws_gd.Cells(r, c).Value) for c in range(3, 15)]
                print(f"Row {r}: {row_vals}")

finally:
    wb.Close(False)
    excel.Quit()
