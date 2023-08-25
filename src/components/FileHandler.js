import fs from 'fs'; // Import the fs module for filesystem operations
import Airtable from 'airtable';
import 'dotenv/config';

export async function readURLsFromAirtable() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = 'List'; // Replace with your actual table name

    const base = new Airtable({ apiKey }).base(baseId);

    try {
        console.log(`Reading URLs from Airtable...`);
        const records = await base(table).select().all();

        return records.map(record => record.get('URLS')); // Use the correct column name
    } catch (error) {
        console.warn(`Error reading URLs from Airtable:`, error.message);
        return [];
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

export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export function getSourceFile() {
    if (fs.existsSync('source.xlsx')) {
        return 'source.xlsx';
    }
    return null;
}
