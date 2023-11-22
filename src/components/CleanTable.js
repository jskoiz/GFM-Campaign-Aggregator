import Airtable from 'airtable';

export async function cleanExistingRowsInAirtable() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = 'Family Details';

    const base = new Airtable({ apiKey }).base(baseId);

    try {
        console.log('Clearing all existing rows in Airtable...');

        const recordsToDelete = [];
        await base(table).select().eachPage((records, fetchNextPage) => {
            records.forEach(record => {
                recordsToDelete.push(record.id);
            });
            fetchNextPage();
        });

        console.log(`Found ${recordsToDelete.length} records to delete.`);

        // Deleting records in batches
        while(recordsToDelete.length > 0) {
            const batch = recordsToDelete.splice(0, 10);
            await base(table).destroy(batch);
            console.log(`Deleted a batch of ${batch.length} records.`);
        }

        console.log('All rows cleared successfully.');
    } catch (error) {
        console.error('Error clearing rows in Airtable:', error);
    }
}
