import { getSourceFile, readURLsFromFile } from './components/FileHandler.js';
import { fetchData, extractData } from './components/DataFetcher.js';
import { asyncPool } from './components/Concurrency.js';
import { writeResultsToFile } from './components/ExcelWriter.js';

const CONCURRENT_LIMIT = 100; // Define the concurrent limit

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

    await writeResultsToFile(results);
}

const inputFilename = getSourceFile();
if (!inputFilename) {
    console.error('Please ensure a source.xlsx file is in the current directory.');
    process.exit(1);
}

main(inputFilename).catch(err => {
    console.error('An error occurred:', err);
});
