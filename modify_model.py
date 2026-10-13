import win32com.client
import os

excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False
file_path = os.path.abspath(r'd:\DIA+\model.xlsx')
wb = excel.Workbooks.Open(file_path)

try:
    # 1. Update Marketing Cost
    print("Modifying Marketing Cost...")
    # Find DIA_Chi Phí
    ws_cp = None
    for sheet in wb.Sheets:
        if "DIA_Chi Ph" in sheet.Name:
            ws_cp = sheet
            break
            
    if ws_cp:
        # We need to change Marketing ra mắt (around row 113) and Marketing (around row 124)
        for r in range(110, 130):
            val = ws_cp.Cells(r, 2).Value
            if val and isinstance(val, str):
                if 'Marketing ra mắt' in val:
                    print(f"Old Marketing ra mắt: {ws_cp.Cells(r, 4).Value}")
                    ws_cp.Cells(r, 4).Value = 50000000  # set to 50m
                    print(f"New Marketing ra mắt: {ws_cp.Cells(r, 4).Value}")
                elif 'Marketing' in val and 'ra mắt' not in val:
                    print(f"Old Marketing Year 1: {ws_cp.Cells(r, 3).Value}")
                    ws_cp.Cells(r, 3).Value = 5000000  # set to 5m/month
                    print(f"New Marketing Year 1: {ws_cp.Cells(r, 3).Value}")

    # 2. Update IRR in DIA_Tóm Tắt
    print("Fixing IRR calculation...")
    ws_tt = None
    for sheet in wb.Sheets:
        if "Tóm Tắt" in sheet.Name:
            ws_tt = sheet
            break
            
    if ws_tt:
        for r in range(290, 310):
            for c in range(5, 10):
                if ws_tt.Cells(r, c).Value == 'IRR':
                    # Set the formula for IRR
                    # The cash flows are in DIA_Hiệu Quả TC, row 309: Dòng tiền lũy kế is a running sum, we need 'Dòng tiền ròng'
                    # Wait, 'Dòng tiền ròng' is in DIA_Hiệu Quả TC Row 250, but we also need Year 0.
                    # Year 0: DIA_Hiệu Quả TC!B249 (Đầu tư ban đầu)
                    # Year 1-3: DIA_Hiệu Quả TC!C250:E250
                    # A trick is to use an array in the formula: =IRR(('DIA_Hiệu Quả TC'!B249,'DIA_Hiệu Quả TC'!C250:E250)) 
                    # Note: depending on regional settings, comma or semicolon is needed. We will use standard english formula (comma)
                    # or better: we just calculate it in DIA_Hiệu Quả TC row 252 and reference it.
                    pass
    
    ws_hq = None
    for sheet in wb.Sheets:
        if "Hiệu Quả TC" in sheet.Name:
            ws_hq = sheet
            break
            
    if ws_hq:
        # Create a Net Cash Flow row at 252
        ws_hq.Cells(252, 2).Value = "Dòng tiền ròng tổng hợp (IRR)"
        # Year 0 = Dòng tiền đầu tư ban đầu (Row 249)
        ws_hq.Cells(252, 3).Formula = "=C249"
        # Year 1 to 3 = Dòng tiền từ hoạt động kd (Row 250) + Đầu tư ban đầu (Row 249 if any)
        ws_hq.Cells(252, 4).Formula = "=D249+D250"
        ws_hq.Cells(252, 5).Formula = "=E249+E250"
        ws_hq.Cells(252, 6).Formula = "=F249+F250"
        
        # Calculate IRR at cell 252, 7 (Year 4 column or beside it)
        ws_hq.Cells(252, 7).Formula = "=IRR(C252:F252)"
        
        if ws_tt:
            # reference the calculated IRR
            for r in range(290, 310):
                for c in range(5, 10):
                    if ws_tt.Cells(r, c).Value == 'IRR':
                        ws_tt.Cells(r, c+1).Formula = "='DIA_Hiệu Quả TC'!G252"
                        # format as percentage
                        ws_tt.Cells(r, c+1).NumberFormat = "0.00%"
                        print("IRR Formula updated!")

    # Force calculation to update values
    excel.Calculate()

    # Save
    wb.Save()
    print("Saved successfully.")
    
except Exception as e:
    print("Error:", e)
finally:
    wb.Close(False)
    excel.Quit()
