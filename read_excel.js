const xlsx = require('xlsx');
const fs = require('fs');
const filePath = 'd:/DIA+/DIA+_Mô hình tài chính - đã hiệu chỉnh.xlsx';
const workbook = xlsx.readFile(filePath);

let output = '';
workbook.SheetNames.forEach(sheetName => {
    output += `\n--- Sheet: ${sheetName} ---\n`;
    const worksheet = workbook.Sheets[sheetName];
    // Convert to csv to get a quick textual representation
    const csv = xlsx.utils.sheet_to_csv(worksheet, { blankrows: false });
    // limit lines
    const lines = csv.split('\n').filter(line => line.replace(/,/g, '').trim() !== '');
    output += lines.slice(0, 50).join('\n') + '\n';
});

fs.writeFileSync('excel_output.txt', output);
console.log('Done reading excel.');
