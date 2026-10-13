import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')

    with io.open(r'd:\DIA+\scan_row7.txt', 'w', encoding='utf-8') as f:
        f.write("=== DIA_Tóm Tắt Row 7 - All Columns ===\n")
        for c in range(1, 16):  # columns A to O
            val = ws_dash.Cells(7, c).Value
            fm  = ws_dash.Cells(7, c).Formula
            col_letter = chr(64 + c) if c <= 26 else '?'
            f.write(f"  Col {col_letter} (col {c}): value={val}, formula={fm}\n")

    print("Scan done.")

except Exception as e:
    print(f"Error: {e}")
finally:
    wb.Close(False)
    excel.Quit()
