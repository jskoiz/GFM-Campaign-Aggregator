import Airtable from 'airtable';
import 'dotenv/config';
import { fileURLToPath } from 'url';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const base = new Airtable({ apiKey }).base(baseId);

export async function identifyAndCopyDuplicates() {
    console.log('Starting process to identify duplicates in Airtable...');

    if (!apiKey || !baseId) {
        console.error('Airtable API key or Base ID is missing.');
        return;
    }

    const sourceTable = 'Family Details';
    const targetTable = 'Duplicates';

    try {
        console.log('Fetching records from Airtable...');
        const records = await base(sourceTable).select().all();
        console.log(`Fetched ${records.length} records.`);

        let titles = new Map();
        let duplicates = [];

        records.forEach(record => {
            const title = record.get('Title');
            if (titles.has(title)) {
                // Only include the Title and GoFundMe Link fields for the duplicate record
                const duplicateFields = {
                    'Title': record.get('Title'),
                    'GoFundMe Link': record.get('GoFundMe Link'),
                    'Original Row': record.id 
                };
                
                duplicates.push({ fields: duplicateFields });
            } else {
                titles.set(title, record.id);
            }
        });

        console.log(`Identified ${duplicates.length} duplicate records.`);

        // Copy duplicates to the 'Duplicates' base
        while (duplicates.length) {
            const batch = duplicates.splice(0, 10);
            console.log(`Copying a batch of ${batch.length} duplicates to the 'Duplicates' base...`);
            await base(targetTable).create(batch);
        }

        console.log(`Duplicates copied to the 'Duplicates' base successfully.`);
    } catch (error) {
        console.error('Error copying duplicates to the new base:', error);
    }
}

const main = async () => {
    console.log('Running DeleteDuplicates.js as a standalone script...');
    await identifyAndCopyDuplicates();
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(error => {
        console.error('An error occurred while running the script:', error);
    });
}
