import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')

    # Scan ALL rows to find any rogue cells with old IRR/NPV formulas
    stale_cells = []
    for r in range(1, 30):
        for c in range(1, 20):
            fm = ws_dash.Cells(r, c).Formula
            if 'C62:F62' in fm or 'C62:E62' in fm:
                stale_cells.append((r, c, fm))
                ws_dash.Cells(r, c).ClearContents()

    wb.Save()

    with io.open(r'd:\DIA+\cleaned.txt', 'w', encoding='utf-8') as f:
        f.write(f"Cleared {len(stale_cells)} stale cells:\n")
        for r, c, fm in stale_cells:
            col_letter = chr(64 + c)
            f.write(f"  {col_letter}{r}: {fm}\n")

    print(f"Done. Cleared {len(stale_cells)} stale cells.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
