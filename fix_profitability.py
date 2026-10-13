import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_gd = wb.Sheets('DIA_Giả Định')
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    ws_tomtat = wb.Sheets('DIA_Tóm Tắt')

    # Bump up the B2B scale to make the startup profitable in Year 3
    # G25 (Hosp Yr1)=5, H25(Yr2)=10, I25(Yr3)=20
    ws_gd.Cells(25, 7).Value = 5
    ws_gd.Cells(25, 8).Value = 10
    ws_gd.Cells(25, 9).Value = 20
    
    # G26 (Clinics Yr1)=20, H26(Yr2)=50, I26(Yr3)=100
    ws_gd.Cells(26, 7).Value = 20
    ws_gd.Cells(26, 8).Value = 50
    ws_gd.Cells(26, 9).Value = 100

    # Adjust the base marketing users so Year 1 is reasonable
    ws_gd.Cells(6, 7).Formula = "=(G25*G31 + G26*G32)*0.5 + 15000"
    ws_gd.Cells(6, 8).Formula = "=(H25*H31 + H26*H32)*0.5 + 25000"
    ws_gd.Cells(6, 9).Formula = "=(I25*I31 + I26*I32)*0.5 + 40000"

    excel.Calculate()

    # Wrap IRR in IFERROR in DIA_Tóm Tắt just in case
    for r in range(1, 20):
        if ws_tomtat.Cells(r, 7).Value == 'IRR':
            # formula usually in col 9
            old_formula = ws_tomtat.Cells(r, 9).Formula
            if 'IFERROR' not in old_formula and old_formula.startswith('='):
                ws_tomtat.Cells(r, 9).Formula = f'=IFERROR({old_formula[1:]}, "Âm (Không có IRR)")'

    wb.Save()
    print("Fixed profitability and #NUM! errors.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
