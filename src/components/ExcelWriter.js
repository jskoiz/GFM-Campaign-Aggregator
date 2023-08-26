import Airtable from 'airtable';
import ExcelJS from 'exceljs';

export async function writeResultsToAirtable(results) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = 'Family Details'; // Replace with the name of your output table

    const base = new Airtable({ apiKey }).base(baseId);

    try {
        console.log('Writing results to Airtable...');

        const batchSize = 10; // Maximum records per batch
        for (let i = 0; i < results.length; i += batchSize) {
            const batchResults = results.slice(i, i + batchSize);

            const formattedResults = batchResults.map(result => {
                const fields = {
                    Title: result.data && result.data.title ? result.data.title : '',
                    'Raised Amount': result.data && result.data.raisedAmount ? parseFloat(result.data.raisedAmount.replace(/[^0-9.-]+/g, '')) : 0,
                    'Target Amount': result.data && result.data.targetAmount ? parseFloat(result.data.targetAmount.replace(/[^0-9.-]+/g, '')) : 0,
                    'Image URL': result.data && result.data.imageUrl ? result.data.imageUrl : '',
                    'Team Fundraiser': result.data && result.data.teamFundraiser ? result.data.teamFundraiser : '',
                    'Description': result.data && result.data.description ? result.data.description : '',
                    Error: result.error ? result.error : ''
                };

                // Check if GoFundMe Link is valid before adding it to fields
                if (result.data && result.data.goFundMeLink && result.data.goFundMeLink !== 'INVALID') {
                    fields['GoFundMe Link'] = result.data.goFundMeLink;
                }

                return { fields };
            });

            await base(table).create(formattedResults);

            console.log(`Batch ${i / batchSize + 1} written to Airtable successfully.`);
        }

        console.log('All batches written to Airtable successfully.');
    } catch (error) {
        console.warn('Error writing results to Airtable:', error);
    }
}
