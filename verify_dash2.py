import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    with io.open(r'd:\DIA+\verify_dash2.txt', 'w', encoding='utf-8') as f:
        f.write(f"NPV (G7): {ws_dash.Range('G7').Value}\n")
        f.write(f"IRR (I7): {ws_dash.Range('I7').Value}\n")
        f.write(f"Nhu cầu vốn (G13): {ws_dash.Range('G13').Value}\n")
        f.write(f"Vốn gọi đề xuất (I13): {ws_dash.Range('I13').Value}\n")

finally:
    wb.Close(False)
    excel.Quit()
