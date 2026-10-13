import win32com.client
import os
import io

file_path = os.path.abspath(r'd:\DIA+\DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx')
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False

try:
    wb = excel.Workbooks.Open(file_path, UpdateLinks=0)
    ws_gd = wb.Sheets('DIA_Giả Định')
    ws_cp = wb.Sheets('DIA_Chi Phí')
    
    with io.open(r'd:\DIA+\coords_out2.txt', 'w', encoding='utf-8') as f:
        f.write("--- DIA_Giả Định ---\n")
        for r in range(1, 150):
            val2 = str(ws_gd.Cells(r, 2).Value).strip()
            val3 = str(ws_gd.Cells(r, 3).Value).strip()
            if val2 and val2 != 'None':
                f.write(f"R{r}C2: {val2}\n")
            if val3 and val3 != 'None':
                f.write(f"R{r}C3: {val3}\n")
                
        f.write("--- DIA_Chi Phí ---\n")
        for r in range(1, 150):
            val2 = str(ws_cp.Cells(r, 2).Value).strip()
            val3 = str(ws_cp.Cells(r, 3).Value).strip()
            if val2 and val2 != 'None':
                f.write(f"R{r}C2: {val2}\n")
            if val3 and val3 != 'None':
                f.write(f"R{r}C3: {val3}\n")
finally:
    wb.Close(False)
    excel.Quit()
