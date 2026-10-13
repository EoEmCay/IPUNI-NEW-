import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_gd = wb.Sheets('DIA_Giả Định')
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    # Increase Yr3 Hosp to 30, Clinics to 150
    ws_gd.Cells(25, 9).Value = 30
    ws_gd.Cells(26, 9).Value = 150
    
    # Increase base marketing users 
    # Year 1: 20000, Year 2: 40000, Year 3: 70000
    ws_gd.Cells(6, 7).Formula = "=(G25*G31 + G26*G32)*0.5 + 20000"
    ws_gd.Cells(6, 8).Formula = "=(H25*H31 + H26*H32)*0.5 + 40000"
    ws_gd.Cells(6, 9).Formula = "=(I25*I31 + I26*I32)*0.5 + 70000"

    # Increase B2B price slightly so they get more revenue
    # B2B Clinic price currently 9.9M/year.
    # Let's bump the API Integration Fee (Phí tích hợp API) to 60M instead of 40M
    ws_gd.Cells(42, 3).Value = 60000000

    excel.Calculate()

    # Re-verify the sum of CFs
    cf0 = ws_fin.Cells(62, 2).Value
    cf1 = ws_fin.Cells(62, 3).Value
    cf2 = ws_fin.Cells(62, 4).Value
    cf3 = ws_fin.Cells(62, 5).Value
    
    print(f"New CFs: {cf0}, {cf1}, {cf2}, {cf3}")
    print(f"Sum = {cf0+cf1+cf2+cf3}")

    wb.Save()
    print("Fixed profitability. Should be positive now.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
