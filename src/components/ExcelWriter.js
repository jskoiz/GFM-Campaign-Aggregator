import Airtable from 'airtable'; // Import the Airtable module
import ExcelJS from 'exceljs';

export async function writeResultsToAirtable(results) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = 'Output'; // Replace with the name of your output table

    const base = new Airtable({ apiKey }).base(baseId);

    try {
        console.log('Writing results to Airtable...');

        const batchSize = 10; // Maximum records per batch
        for (let i = 0; i < results.length; i += batchSize) {
            const batchResults = results.slice(i, i + batchSize);

            const formattedResults = batchResults.map(result => ({
                fields: {
                    Title: result.data.title,
                    'Raised Amount': parseFloat(result.data.raisedAmount.replace(/[^0-9.-]+/g, '')), // Parse the currency string
                    'Target Amount': parseFloat(result.data.targetAmount.replace(/[^0-9.-]+/g, '')), // Parse the currency string
                    'Image URL': result.data.imageUrl,
                    Error: result.error
                }
            }));

            await base(table).create(formattedResults);

            console.log(`Batch ${i / batchSize + 1} written to Airtable successfully.`);
        }

        console.log('All batches written to Airtable successfully.');
    } catch (error) {
        console.warn('Error writing results to Airtable:', error.message);
    }
}
