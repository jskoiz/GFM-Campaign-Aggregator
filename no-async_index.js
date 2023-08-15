import axios from 'axios';
import cheerio from 'cheerio';
import ExcelJS from 'exceljs';
import fs from 'fs';
import csvParser from 'csv-parser';
import { URL } from 'url'; 

const CONCURRENT_LIMIT = 100;

// URL validation function
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function fetchData(url) {
    try {
        console.log(`Fetching data from ${url}...`);
        const result = await axios.get(url);
        return cheerio.load(result.data);
    } catch (error) {
        console.warn(`Error fetching data from ${url}:`, error.message);
        return null;
    }
}

async function main(inputFilename) {
    const urls = await readURLsFromFile(inputFilename);

    const results = [];
    for (let i = 0; i < urls.length; i += CONCURRENT_LIMIT) {
        const slice = urls.slice(i, i + CONCURRENT_LIMIT);
        const batchResults = await Promise.all(slice.map(async url => {
            const $ = await fetchData(url);
            return extractData($, url);
        }));
        results.push(...batchResults);
    }

    const validResults = results.filter(r => r !== null); // Filter out null results

    console.log('Writing extracted data to GoFundMe-Details.xlsx...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scraped Data');
    worksheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Raised Amount', key: 'raisedAmount' },
        { header: 'Target Amount', key: 'targetAmount' },
        { header: 'Image URL', key: 'imageUrl' }
    ];
    validResults.forEach(item => {
        worksheet.addRow(item);
    });

    await workbook.xlsx.writeFile('GoFundMe-Details.xlsx');
    console.log('Data written to GoFundMe-Details.xlsx successfully.');
}

function extractData($, url) {
    if (!$) return null;

    try {
        console.log('Extracting data from fetched content...');
        const title = $('h1.p-campaign-title').text().trim();

        if (!title) throw new Error('Title not found');

        const dataDiv = $('div.progress-meter_progressMeterHeading__7dug0');
        const raisedAmount = dataDiv.find('div.hrt-disp-inline').text().trim();
        const targetAmountRaw = dataDiv.find('span.hrt-text-body-sm.hrt-text-gray').text().trim();

        const targetMatch = targetAmountRaw.match(/\$[\d,]+/);
        if (!targetMatch) throw new Error('Target amount not found');
        const targetAmount = targetMatch[0];

        const imageDivStyle = $('div.a-image.a-image--background').attr('style');
        
        const imageUrlMatch = imageDivStyle.match(/url\(["']?(.*?)["']?\)/);
        const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;

        return { title, raisedAmount, targetAmount, imageUrl };
    } catch (error) {
        console.warn(`Error extracting data from ${url}:`, error.message);
        return null;
    }
}

async function readURLsFromFile(filename) {
    const urls = [];
    console.log(`Reading URLs from ${filename}...`);

    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filename);
        const worksheet = workbook.getWorksheet(1);
        worksheet.eachRow(row => {
            if (row.hasValues) {
                urls.push(row.getCell(1).text);  // Extracting URLs from column A
            }
        });
    } else if (ext === 'csv') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filename)
                .pipe(csvParser())
                .on('data', row => urls.push(row.A))
                .on('end', () => {
                    console.log('Finished reading CSV file.');
                    resolve(urls);
                })
                .on('error', err => reject(err));
        });
    } else {
        throw new Error('Unsupported file format');
    }

    return urls.filter(isValidUrl);
}

const inputFilename = process.argv[2];
if (!inputFilename) {
    console.error('Please provide an input filename.');
    process.exit(1);
}
main(inputFilename).catch(err => {
    console.error('An error occurred:', err);
});
