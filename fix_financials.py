import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    
    # 1. Add Terminal Value and Fix IRR in DIA_Hiệu Quả TC
    ws_hq = wb.Sheets('DIA_Hiệu Quả TC')
    
    # Find the rows dynamically
    ebitda_row = 238
    for r in range(230, 250):
        if ws_hq.Cells(r, 2).Value == 'EBITDA':
            ebitda_row = r
            break
            
    invest_row = 249
    cfo_row = 250
    for r in range(240, 260):
        if ws_hq.Cells(r, 2).Value == 'Dòng tiền đầu tư ban đầu':
            invest_row = r
        elif ws_hq.Cells(r, 2).Value == 'Dòng tiền từ hoạt động kinh doanh':
            cfo_row = r

    # We will use row 253 for Terminal Value, 254 for Net Cash Flow (IRR)
    tv_row = 253
    ncf_row = 254
    
    ws_hq.Cells(tv_row, 2).Value = "Giá trị thanh lý (Terminal Value)"
    # Terminal Value = EBITDA Year 3 * 8 (if EBITDA > 0)
    ws_hq.Cells(tv_row, 6).Formula = f"=MAX(0, F{ebitda_row} * 8)"
    
    ws_hq.Cells(ncf_row, 2).Value = "Dòng tiền ròng tổng hợp (chạy IRR)"
    # Year 0: Invest + CFO (CFO in Year 0 is usually 0) + TV (0)
    ws_hq.Cells(ncf_row, 3).Formula = f"=C{invest_row}+C{cfo_row}"
    # Year 1
    ws_hq.Cells(ncf_row, 4).Formula = f"=D{invest_row}+D{cfo_row}"
    # Year 2
    ws_hq.Cells(ncf_row, 5).Formula = f"=E{invest_row}+E{cfo_row}"
    # Year 3 (including TV)
    ws_hq.Cells(ncf_row, 6).Formula = f"=F{invest_row}+F{cfo_row}+F{tv_row}"
    
    # Cumulative Cash flow for funding needs
    cum_row = 255
    ws_hq.Cells(cum_row, 2).Value = "Dòng tiền lũy kế (Funding)"
    ws_hq.Cells(cum_row, 3).Formula = f"=C{ncf_row}"
    ws_hq.Cells(cum_row, 4).Formula = f"=C{cum_row}+D{ncf_row}"
    ws_hq.Cells(cum_row, 5).Formula = f"=D{cum_row}+E{ncf_row}"
    ws_hq.Cells(cum_row, 6).Formula = f"=E{cum_row}+F{ncf_row}"

    # Calculate IRR in G254
    ws_hq.Cells(ncf_row, 7).Formula = f"=IRR(C{ncf_row}:F{ncf_row}, 0.1)"
    
    # 2. Fix Dashboard DIA_Tóm Tắt
    ws_tt = wb.Sheets('DIA_Tóm Tắt')
    # Find Nhu cầu vốn and Vốn gọi đề xuất
    for r in range(290, 310):
        for c in range(1, 10):
            val = ws_tt.Cells(r, c).Value
            if val == 'Nhu cầu vốn':
                # Max drawdown is the minimum of cumulative cash flow
                ws_tt.Cells(r, c+1).Formula = f"=-MIN('DIA_Hiệu Quả TC'!C{cum_row}:F{cum_row})"
                print(f"Fixed Nhu cầu vốn at Row {r}, Col {c}")
            elif val == 'Vốn gọi đề xuất':
                # Vốn gọi đề xuất có thể làm tròn lên từ Nhu cầu vốn
                ws_tt.Cells(r, c+1).Formula = f"=ROUNDUP({ws_tt.Cells(r, c-1).Address} / 100000000, 0) * 100000000"
                print(f"Fixed Vốn gọi đề xuất at Row {r}, Col {c}")
            elif val == 'IRR':
                ws_tt.Cells(r, c+1).Formula = f"='DIA_Hiệu Quả TC'!G{ncf_row}"
                ws_tt.Cells(r, c+1).NumberFormat = "0.00%"
                print(f"Fixed IRR at Row {r}, Col {c}")

    excel.Calculate()
    wb.Save()
    print("Modifications saved successfully.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
