import 'dotenv/config';
import { readURLsFromAirtable } from './components/FileHandler.js';
import { fetchData, extractData } from './components/DataFetcher.js';
import { asyncPool } from './components/Concurrency.js';
import { writeResultsToAirtable } from './components/ExcelWriter.js'; // Update the import

const CONCURRENT_LIMIT = 20; // Define the concurrent limit

async function main() {
    const urls = await readURLsFromAirtable();

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


    await writeResultsToAirtable(results); // Use the updated function
}

main().catch(err => {
    console.error('An error occurred:', err);
});
