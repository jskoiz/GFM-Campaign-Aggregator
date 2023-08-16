import axios from 'axios';
import cheerio from 'cheerio';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { URL } from 'url';

const CONCURRENT_LIMIT = 100;

function getSourceFile() {
    if (fs.existsSync('source.xlsx')) {
        return 'source.xlsx';
    }
    return null;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function readURLsFromFile(filename) {
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


async function fetchData(url) {
    try {
        console.log(`Fetching data from ${url}...`);
        const response = await axios.get(url, { maxRedirects: 5 });

        return {
            $: cheerio.load(response.data),
            finalUrl: response.request.res.responseUrl
        };
    } catch (error) {
        console.warn(`Error fetching data from ${url}:`, error.message);
        return null;
    }
}

function extractData($, url) {
    if (!$) return null;

    const titleElement = $('h1.p-campaign-title');
    const title = titleElement.text().trim();
    console.log(`Extracting data for campaign: "${title}"...`);

    try {        
        if (!titleElement.length) throw new Error('Title not found');

        const dataDiv = $('div.progress-meter_progressMeterHeading__7dug0');
        const raisedAmountElement = dataDiv.find('div.hrt-disp-inline');
        if (!raisedAmountElement.length) throw new Error('Raised amount not found');
        const raisedAmount = raisedAmountElement.text().trim();

        const targetAmountRawElement = dataDiv.find('span.hrt-text-body-sm.hrt-text-gray');
        if (!targetAmountRawElement.length) throw new Error('Target amount element not found');
        const targetAmountRaw = targetAmountRawElement.text().trim();

        const targetMatch = targetAmountRaw.match(/\$[\d,]+/);
        if (!targetMatch) throw new Error('Target amount not found');
        const targetAmount = targetMatch[0];

        const imageDivStyle = $('div.a-image.a-image--background').attr('style');
        const imageUrlMatch = imageDivStyle.match(/url\(["']?(.*?)["']?\)/);
        const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;

        return { title, raisedAmount, targetAmount, imageUrl };
    } catch (error) {
        console.warn(`Error extracting data for campaign: "${title}"`, error.message);
        return null;
    }
}

async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item));
        ret.push(p);

        if (executing.push(p) > poolLimit) {
            executing.splice(executing.indexOf(await Promise.race(executing)), 1);
        }
    }

    await Promise.all(executing);
    return Promise.all(ret);
}

async function main(inputFilename) {
    const urls = await readURLsFromFile(inputFilename);

    const results = await asyncPool(CONCURRENT_LIMIT, urls, async (url) => {
        try {
            const data = await fetchData(url);
            if (!data) return { error: `Error fetching ${url}` };
            
            const extractedData = extractData(data.$, data.finalUrl);
            if (!extractedData) return { error: `Error extracting data from ${url}` };
    
            return { data: extractedData, error: null };
        } catch (error) {
            return { error: `Error processing ${url}: ${error.message}` };
        }
    });

    console.log('Writing extracted data to gfm-campaign-details.xlsx...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scraped Data');
    worksheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Raised Amount', key: 'raisedAmount' },
        { header: 'Target Amount', key: 'targetAmount' },
        { header: 'Image URL', key: 'imageUrl' },
        { header: 'Error', key: 'error' }  // New column for errors
    ];
    
    results.forEach(item => {
        if (item.error) {
            worksheet.addRow({ title: 'N/A', raisedAmount: 'N/A', targetAmount: 'N/A', imageUrl: 'N/A', error: item.error });
        } else {
            worksheet.addRow({ ...item.data, error: null });
        }
    });
    
    await workbook.xlsx.writeFile('gfm-campaign-details.xlsx');
    console.log('Data written to gfm-campaign-details.xlsx successfully.');
}
const inputFilename = getSourceFile();
if (!inputFilename) {
    console.error('Please ensure a source.xlsx file is in the current directory.');
    process.exit(1);
}

main(inputFilename).catch(err => {
    console.error('An error occurred:', err);
});