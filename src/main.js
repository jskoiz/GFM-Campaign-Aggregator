// main.js
import './components/Logger.js'; 
import 'dotenv/config';
import { readURLsFromAirtable } from './components/FileHandler.js';
import { fetchData, extractData } from './components/DataFetcher.js';
import { asyncPool } from './components/Concurrency.js';
import { writeResultsToAirtable } from './components/DataWriter.js';
import { cleanExistingRowsInAirtable } from './components/CleanTable.js'; 
import { removeDuplicatesFromAirtable } from './components/DeleteDuplcates.js';

const CONCURRENT_LIMIT = 20;

async function main() {
    // Clean the table before processing new data
    await cleanExistingRowsInAirtable();

    const urls = await readURLsFromAirtable();
    const totalCount = urls.length;

    const results = await asyncPool(CONCURRENT_LIMIT, urls, async (url, index) => {
        try {
            const fetchResult = await fetchData(url, index, totalCount);
            if (!fetchResult || fetchResult.error) {
                return { url, error: `Error fetching ${url}`, status: 'error' };
            }

            const extractedData = extractData(fetchResult.$, fetchResult.finalUrl);
            if (!extractedData) {
                return { url, error: `Error extracting data from ${url}`, status: 'error' };
            }

            return { data: extractedData, error: null, status: 'success' };
        } catch (error) {
            return { url, error: `Error processing ${url}: ${error.message}`, status: 'error' };
        }
    });

    await writeResultsToAirtable(results);

}

main().catch(err => {
    console.error('An error occurred:', err);
});
