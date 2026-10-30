# Don dep file rac mot cach an toan: CHI DI CHUYEN vao thu muc _to_delete\, KHONG xoa.
# Cach dung (PowerShell, trong thu muc du an):  powershell -ExecutionPolicy Bypass -File scripts\don_dep.ps1
# Sau khi chay: mo app len thu, chay "npm test" va "npm run build". Neu on, xoa thu muc _to_delete\ va chay
#   git add -A ; git commit -m "chore: don file rac"
# Neu co gi sai, keo file tu _to_delete\ ve lai cho cu.
$root = Split-Path -Parent $PSScriptRoot
$trash = Join-Path $root "_to_delete"

# 1) Script/ket qua dung mot lan o thu muc goc, file test lat vat, file tam, component bao cao co du lieu bia
$junk = @(
  "check_errors.py","check_final.py","check_financials.py","check_users.py","clear_stale.py","cleaned.txt",
  "coords_out.txt","coords_out2.txt","dash_formula.py","dash_formula.txt","deep_check.py","deep_check.txt",
  "excel_output.txt","extract.ps1","find_250.py","find_250.txt","find_250_formulas.py","find_250_formulas.txt",
  "find_cells.py","find_cells_win32.py","find_dashboard.py","find_ncf.py","find_real_ncf.py","find_real_ncf.txt",
  "fin_rows.txt","fix_dashboard.py","fix_dashboard_no_print.py","fix_dashboard_pointers.py","fix_exact_cells.py",
  "fix_final.py","fix_financials.py","fix_profitability.py","fix_profitability2.py","get_coords.py","get_coords2.py",
  "khay.patch","modify_model.py","output.txt","output_errors.txt","output_final.txt","read_excel.js",
  "restructure_model.py","scan_row7.py","scan_row7.txt","test-db.js","test-db-2.js","test-scan.js","test_api.js",
  "test_db.js","test_medications.js","token.txt","update_landing.py","update_price.py","verify_cf.py","verify_cf.txt",
  "verify_dash.py","verify_dash.txt","verify_dash2.py","verify_dash2.txt","verify_final.txt",
  "backend\testEsmsOut.txt",
  "frontend\src\pages\LandingPage.module.css.tmp",
  "frontend\src\components\common\DoctorA4ReportModal.jsx",
  "frontend\src\components\common\DoctorA4ReportModal.module.css"
)

# 2) Tai lieu cu: chuyen vao docs\archive (khong bi xoa, chi cat khoi cho de nhin thay)
$archive = @("PROJECT_SUMMARY.docx","DESIGN_DOCS")

function Move-Safe($rel, $destRoot) {
  $src = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $src)) { return }
  $dst = Join-Path $destRoot $rel
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
  Move-Item -LiteralPath $src -Destination $dst
  Write-Host "da chuyen: $rel"
}

foreach ($f in $junk) { Move-Safe $f $trash }
foreach ($f in $archive) { Move-Safe $f (Join-Path $root "docs\archive") }

Write-Host ""
Write-Host "XEM LAI THU CONG (script KHONG tu dong dong vao):"
Write-Host " - model.xlsx va ban *_backup.xlsx: ban sao cua mo hinh tai chinh, giu 1 ban chinh"
Write-Host " - FORQUY-*/ va thu muc anh [DIA+]-*/ : anh chup man hinh, nen cat khoi repo (dua len Drive)"
Write-Host " - congthuc_taichinh_dia/ : anh cong thuc tai chinh, cung nen cat khoi repo"
Write-Host " - translate_advice.js, translate_detail.js : script dich mot lan, xoa neu da dich xong"
Write-Host " - backend\test_prescriptions\vn_*.png : neu la don thuoc that co ten benh nhan thi PHAI go khoi repo cong khai"
Write-Host " - IPUNI-NEW\ (ban sao cu long ben trong, khong nam trong git): xoa sau khi chac chan khong con can"
Write-Host " - .agents\ va skills-lock.json : cong cu cua Claude Code, giu neu ban con dung"
