import fs from 'fs';
import { URL } from 'url';
import ExcelJS from 'exceljs';

export function getSourceFile() {
    if (fs.existsSync('source.xlsx')) {
        return 'source.xlsx';
    }
    return null;
}

export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export async function readURLsFromFile(filename) {
    const urls = [];
    console.log(`Reading URLs from ${filename}...`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filename);
    const worksheet = workbook.getWorksheet(1);
    worksheet.eachRow(row => {
        if (row.hasValues) {
            urls.push(row.getCell(1).text);
        }
    });

    return urls.filter(isValidUrl);
}
