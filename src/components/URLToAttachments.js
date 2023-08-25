import { table, selectRecordsAsync, updateRecordsAsync } from '@airtable/blocks/models';
import Airtable from 'airtable';
import 'dotenv/config';


async function convertURLsToAttachments() {
    const tableId = 'Output'; // Update with your table name
    const urlFieldId = 'Image URL'; // Update with your URL field name
    const attachmentFieldId = 'Picture'; // Update with your attachment field name

    const tableToProcess = table.find(tableId);
    if (!tableToProcess) {
        console.error(`Table ${tableId} not found.`);
        return;
    }

    const urlField = tableToProcess.getFieldByIdIfExists(urlFieldId);
    const attachmentField = tableToProcess.getFieldByIdIfExists(attachmentFieldId);

    if (!urlField || !attachmentField || attachmentField.type !== 'multipleAttachments') {
        console.error(`Invalid fields configuration.`);
        return;
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    const updates = [];
    for (const record of (await selectRecordsAsync(tableToProcess, { fields: [urlField, attachmentField] })).records) {
        const existingAttachments = record.getCellValue(attachmentField) || [];
        const urls = record.getCellValueAsString(urlField);
        if (typeof urls !== 'string') continue;

        const attachmentsFromUrls = urls.split('\n').map(url => ({ url: url.trim() }));
        updates.push({
            id: record.id,
            fields: {
                [attachmentField.id]: [...existingAttachments, ...attachmentsFromUrls],
            },
        });
    }

    for (let i = 0; i < updates.length; i += 50) {
        await updateRecordsAsync(tableToProcess, updates.slice(i, i + 50));
    }
}

convertURLsToAttachments().catch(error => {
    console.error('An error occurred:', error);
});
