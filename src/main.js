import 'dotenv/config';
import { readURLsFromAirtable } from './components/FileHandler.js';
import { fetchData, extractData } from './components/DataFetcher.js';
import { asyncPool } from './components/Concurrency.js';
import { writeResultsToAirtable } from './components/ExcelWriter.js';

const CONCURRENT_LIMIT = 20;
const BATCH_SIZE = 10; 

async function main() {
    const urls = await readURLsFromAirtable();

    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);
    let processedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchUrls = urls.slice(batchStart, batchStart + BATCH_SIZE);

        const results = await asyncPool(CONCURRENT_LIMIT, batchUrls, async (url) => {
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

        await writeResultsToAirtable(results);

        processedCount += results.length;
        console.log(`Batch ${i + 1}/${totalBatches} processed. Total processed: ${processedCount}/${urls.length}`);
    }
}

main().catch(err => {
    console.error('An error occurred:', err);
});
