import 'dotenv/config';
import { readURLsFromAirtable } from './components/FileHandler.js';
import { fetchData, extractData } from './components/DataFetcher.js';
import { asyncPool } from './components/Concurrency.js';
import { writeResultsToAirtable } from './components/ExcelWriter.js';
import { cleanExistingRowsInAirtable } from './components/CleanErrors.js'; // Adjust the path to where your cleaning function is located

const CONCURRENT_LIMIT = 20;

async function main() {
    // Clean the table before processing new data
    await cleanExistingRowsInAirtable();

    const urls = await readURLsFromAirtable();
    const totalCount = urls.length;

    const results = await asyncPool(CONCURRENT_LIMIT, urls, async (url, index) => {
        try {
            const data = await fetchData(url, index, totalCount);
            if (!data) {
                return { error: `Error fetching ${url}` };
            }

            const extractedData = extractData(data.$, data.finalUrl);
            if (!extractedData) {
                return { error: `Error extracting data from ${url}` };
            }

            return { data: extractedData, error: null };
        } catch (error) {
            return { error: `Error processing ${url}: ${error.message}` };
        }
    });

    await writeResultsToAirtable(results);
}

main().catch(err => {
    console.error('An error occurred:', err);
});
