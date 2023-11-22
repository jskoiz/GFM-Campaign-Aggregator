import Airtable from 'airtable';

export async function writeResultsToAirtable(results) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = 'Family Details';

    const base = new Airtable({ apiKey }).base(baseId);

    let totalProcessed = 0;
    let totalSkipped = 0;
    const startTime = new Date();

    try {
        console.log('Writing results to Airtable...');

        const batchSize = 10;
        for (let i = 0; i < results.length; i += batchSize) {
            const batchResults = results.slice(i, i + batchSize);

            // Filter out results that should not be written
            const validResults = batchResults.filter(result => result.data && !result.error);

            const formattedResults = validResults.map(result => {
                const fields = {
                    Title: result.data.title,
                    'Raised Amount': parseFloat(result.data.raisedAmount.replace(/[^0-9.-]+/g, '')),
                    'Target Amount': parseFloat(result.data.targetAmount.replace(/[^0-9.-]+/g, '')),
                    'Image URL': result.data.imageUrl,
                    'Team Fundraiser': result.data.teamFundraiser,
                    'Description': result.data.description,
                    'Last Updated': new Date().toISOString()
                };

                if (result.data.goFundMeLink && result.data.goFundMeLink !== 'INVALID') {
                    fields['GoFundMe Link'] = result.data.goFundMeLink;
                }

                return { fields };
            });

            if (formattedResults.length > 0) {
                await base(table).create(formattedResults);
                totalProcessed += formattedResults.length;
                console.log(`Batch ${i / batchSize + 1} written to Airtable successfully.`);
            }

            // Update the skipped count
            totalSkipped += (batchResults.length - validResults.length);
        }

        console.log('All batches written to Airtable successfully.');
    } catch (error) {
        console.warn('Error writing results to Airtable:', error);
    } finally {
        const endTime = new Date();
        const processingTime = (endTime - startTime) / 1000;

        console.log(`Total Processed: ${totalProcessed}`);
        console.log(`Total Skipped: ${totalSkipped}`);
        console.log(`Total Time Taken: ${processingTime} seconds`);
    }
}
