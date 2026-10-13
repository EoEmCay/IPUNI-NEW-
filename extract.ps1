$ErrorActionPreference = "Stop"
$docxPath = "d:\DIA+\DIAPLUS_THUYETMINH (3).docx"
$outPath = "d:\DIA+\docx_text_updated.txt"

$zipPath = "d:\DIA+\temp.zip"
Copy-Item $docxPath $zipPath -Force

Expand-Archive -Path $zipPath -DestinationPath "d:\DIA+\temp_docx" -Force
$xml = Get-Content "d:\DIA+\temp_docx\word\document.xml" -Raw

$text = [System.Text.RegularExpressions.Regex]::Replace($xml, '<[^>]+>', ' ')
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '\s+', ' ')

$text | Out-File $outPath -Encoding UTF8

Remove-Item $zipPath -Force
Remove-Item "d:\DIA+\temp_docx" -Recurse -Force
