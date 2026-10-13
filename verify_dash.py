import win32com.client
import os

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_dash = wb.Sheets('DIA_Tóm Tắt')
    
    with open(r'd:\DIA+\verify_dash.txt', 'w', encoding='utf-8') as f:
        f.write("--- Dashboard Final Values ---\n")
        f.write(f"NPV: {ws_dash.Cells(7, 7).Value}\n")
        f.write(f"IRR: {ws_dash.Cells(7, 9).Value}\n")
        f.write(f"Nhu cầu vốn: {ws_dash.Cells(13, 7).Value}\n")
        f.write(f"Vốn gọi đề xuất: {ws_dash.Cells(13, 9).Value}\n")

finally:
    wb.Close(False)
    excel.Quit()
