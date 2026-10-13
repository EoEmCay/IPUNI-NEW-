import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_tt = wb.Sheets('DIA_Tóm Tắt')
    
    for r in range(1, 400):
        for c in range(1, 15):
            val = ws_tt.Cells(r, c).Value
            if val and isinstance(val, str):
                val_strip = val.strip()
                if val_strip == 'Nhu cầu vốn':
                    ws_tt.Cells(r, c+1).Formula = "=-MIN('DIA_Hiệu Quả TC'!C255:F255)"
                elif val_strip == 'Vốn gọi đề xuất':
                    ws_tt.Cells(r, c+1).Formula = f"=ROUNDUP({ws_tt.Cells(r, c-1).Address} / 100000000, 0) * 100000000"
                elif val_strip == 'IRR':
                    ws_tt.Cells(r, c+1).Formula = "='DIA_Hiệu Quả TC'!G254"
                    ws_tt.Cells(r, c+1).NumberFormat = "0.00%"
                elif val_strip == 'NPV':
                    # Fix NPV to include Terminal Value. The NPV formula is likely calculating DCF.
                    # Let's just adjust NPV formula to use the new NCF row if it's currently using the old FCF
                    # Old FCF was likely row 189 in Kịch Bản or calculated manually.
                    # NPV = NPV(Rate, CashFlows) + Year 0.
                    # NPV in Excel: =NPV(rate, C254:F254) + B254 (Year 0)
                    ws_tt.Cells(r, c+1).Formula = "=NPV(18%, 'DIA_Hiệu Quả TC'!D254:F254) + 'DIA_Hiệu Quả TC'!C254"
    
    excel.Calculate()
    wb.Save()

except Exception as e:
    pass
finally:
    wb.Close(False)
    excel.Quit()
