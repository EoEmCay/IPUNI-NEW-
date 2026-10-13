import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_tt = wb.Sheets('DIA_Tóm Tắt')
    
    # Let's search entire sheet
    for r in range(1, 400):
        for c in range(1, 15):
            val = ws_tt.Cells(r, c).Value
            if val and isinstance(val, str):
                val_strip = val.strip()
                if val_strip == 'Nhu cầu vốn':
                    # Set formula
                    ws_tt.Cells(r, c+1).Formula = "=-MIN('DIA_Hiệu Quả TC'!C255:F255)"
                    print(f"Fixed Nhu cầu vốn at {r}, {c}")
                elif val_strip == 'Vốn gọi đề xuất':
                    # Assuming Nhu cầu vốn is on the same row or we can just reference Nhu cầu vốn cell
                    # In CSV: 'Nhu cầu vốn', '4,908,443,421', 'Vốn gọi đề xuất', '5,000,000,000' (columns 6, 7, 8, 9 probably)
                    # Let's use the adjacent left cell (c-1) if c>2
                    ws_tt.Cells(r, c+1).Formula = f"=ROUNDUP({ws_tt.Cells(r, c-1).Address} / 100000000, 0) * 100000000"
                    print(f"Fixed Vốn gọi đề xuất at {r}, {c}")
                elif val_strip == 'IRR':
                    ws_tt.Cells(r, c+1).Formula = "='DIA_Hiệu Quả TC'!G254"
                    ws_tt.Cells(r, c+1).NumberFormat = "0.00%"
                    print(f"Fixed IRR at {r}, {c}")
                elif val_strip == 'NPV':
                    # Add Terminal Value to NPV calculation if not already
                    # Actually NPV is calculated somewhere else. Let's just fix IRR and Capital Needs.
                    pass
    
    excel.Calculate()
    wb.Save()
    print("Dashboard fixed.")
except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
