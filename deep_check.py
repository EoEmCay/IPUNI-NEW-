import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    ws_fin = wb.Sheets('DIA_Hiệu Quả TC')
    ws_gd = wb.Sheets('DIA_Giả Định')
    
    with io.open(r'd:\DIA+\deep_check.txt', 'w', encoding='utf-8') as f:
        # 1. Check exact formulas in G7 and I7
        f.write("=== Dashboard formulas ===\n")
        f.write(f"G7 formula: {ws_dash.Range('G7').Formula}\n")
        f.write(f"G7 value: {ws_dash.Range('G7').Value}\n")
        f.write(f"I7 formula: {ws_dash.Range('I7').Formula}\n")
        f.write(f"I7 value: {ws_dash.Range('I7').Value}\n")
        
        # 2. Check discount rate cell
        f.write(f"\nDIA_Giả Định C60 value: {ws_gd.Cells(60, 3).Value}\n")
        f.write(f"DIA_Giả Định C60 type: {type(ws_gd.Cells(60, 3).Value)}\n")
        
        # 3. Check cash flow cells C62:F62
        f.write("\n=== Cash Flow Row 62 (C to F) ===\n")
        for c in [3, 4, 5, 6]:
            v = ws_fin.Cells(62, c).Value
            fm = ws_fin.Cells(62, c).Formula
            f.write(f"  Col {c}: value={v}, formula={fm}\n")
        
        # 4. Dump rows 60-65 in DIA_Hiệu Quả TC
        f.write("\n=== DIA_Hiệu Quả TC rows 60-70 ===\n")
        for r in range(60, 71):
            v2 = ws_fin.Cells(r, 2).Value
            c3 = ws_fin.Cells(r, 3).Value
            c4 = ws_fin.Cells(r, 4).Value
            c5 = ws_fin.Cells(r, 5).Value
            c6 = ws_fin.Cells(r, 6).Value
            f.write(f"R{r}: {v2} | {c3} | {c4} | {c5} | {c6}\n")

        # 5. Check actual NCF/NPV rows in fin
        f.write("\n=== Looking for NCF, NPV rows in DIA_Hiệu Quả TC B70-B100 ===\n")
        for r in range(70, 110):
            v = str(ws_fin.Cells(r, 2).Value).strip()
            if v and v != 'None':
                c3 = ws_fin.Cells(r, 3).Value
                c4 = ws_fin.Cells(r, 4).Value
                c5 = ws_fin.Cells(r, 5).Value
                f.write(f"R{r}: {v} | {c3} | {c4} | {c5}\n")

finally:
    wb.Close(False)
    excel.Quit()
