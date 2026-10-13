import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_price = wb.Sheets('DIA_Giá và Doanh Thu')
    
    # Update B2B Clinic monthly and yearly prices
    for r in range(1, 100):
        val = ws_price.Cells(r, 1).Value
        if val and isinstance(val, str):
            if 'DIA+ Clinic/Tháng' in val:
                ws_price.Cells(r, 3).Value = 990000
                # If there's a "Giá thực thu" column (col 6)
                if ws_price.Cells(r, 6).Value == 899000:
                    ws_price.Cells(r, 6).Value = 990000
            elif 'DIA+ Clinic/Năm' in val:
                ws_price.Cells(r, 3).Value = 9900000
                if ws_price.Cells(r, 6).Value == 8900000:
                    ws_price.Cells(r, 6).Value = 9900000
                    
    excel.Calculate()
    wb.Save()
    print("B2B Prices updated successfully.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
