import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    
    # 1. Update Giả Định
    ws_gd = wb.Sheets('DIA_Giả Định')
    ws_gd.Cells(6, 7).Formula = "=(G25*G31 + G26*G32)*0.5 + 5000"
    ws_gd.Cells(6, 8).Formula = "=(H25*H31 + H26*H32)*0.5 + 10000"
    ws_gd.Cells(6, 9).Formula = "=(I25*I31 + I26*I32)*0.5 + 15000"
    
    ws_gd.Cells(26, 9).Value = 50 # Increase Yr3 clinics to hit ~70k target
    
    # 2. Update Giá và Doanh Thu
    ws_price = wb.Sheets('DIA_Giá và Doanh Thu')
    for r in range(1, 100):
        val = str(ws_price.Cells(r, 1).Value)
        if 'Phí triển khai / bệnh viện' in val:
            ws_price.Cells(r, 3).Value = 10000000
            if ws_price.Cells(r, 6).Value is not None:
                ws_price.Cells(r, 6).Value = 10000000
        elif 'Phí triển khai / phòng khám' in val:
            ws_price.Cells(r, 3).Value = 5000000
            if ws_price.Cells(r, 6).Value is not None:
                ws_price.Cells(r, 6).Value = 5000000

    # 3. Add DPP to Dashboard
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    
    excel.Calculate()
    
    # Based on fin_rows.txt, the years are in cols 2,3,4,5
    cf0 = ws_fin.Cells(53, 2).Value
    cf1 = ws_fin.Cells(53, 3).Value
    cf2 = ws_fin.Cells(53, 4).Value
    cf3 = ws_fin.Cells(53, 5).Value
    
    r = ws_gd.Cells(60, 3).Value # Discount rate
    if not isinstance(r, float): r = 0.18
    
    if all(isinstance(x, (int, float)) for x in [cf0, cf1, cf2, cf3]):
        dcf1 = cf1 / (1+r)**1
        dcf2 = cf2 / (1+r)**2
        dcf3 = cf3 / (1+r)**3
        
        cumulative_dcf = cf0
        dpp = 0
        if cumulative_dcf + dcf1 >= 0:
            dpp = 0 + abs(cumulative_dcf)/dcf1
        else:
            cumulative_dcf += dcf1
            if cumulative_dcf + dcf2 >= 0:
                dpp = 1 + abs(cumulative_dcf)/dcf2
            else:
                cumulative_dcf += dcf2
                if cumulative_dcf + dcf3 >= 0:
                    dpp = 2 + abs(cumulative_dcf)/dcf3
                else:
                    dpp = "> 3" 
                    
        # Write to Dashboard
        for row in range(40, 100):
            val = str(ws_dash.Cells(row, 2).Value)
            if val == 'None' or val == '':
                ws_dash.Cells(row, 2).Value = "Thời gian hoàn vốn (DPP)"
                if isinstance(dpp, str):
                    ws_dash.Cells(row, 4).Value = dpp
                    ws_dash.Cells(row, 5).Value = "năm (Chưa thu hồi vốn)"
                else:
                    ws_dash.Cells(row, 4).Value = round(dpp, 2)
                    ws_dash.Cells(row, 5).Value = "năm"
                
                # Highlight if > 3 years
                if isinstance(dpp, str) or dpp > 3:
                    ws_dash.Cells(row, 4).Font.Color = 255 # Red
                else:
                    ws_dash.Cells(row, 4).Font.Color = 5287936 # Green
                break
            
    excel.Calculate()
    wb.Save()
    print("Modifications completed successfully.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
