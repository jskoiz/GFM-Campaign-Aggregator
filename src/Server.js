import express from 'express';
import cron from 'node-cron';
import { main } from './components/poller.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Schedule the initial polling when the server starts
cron.schedule('*/30 * * * *', () => { // Run every 30 minutes
    console.log('Scheduled polling and processing...');
    main();
});

// Endpoint to trigger manual polling
app.get('/manual-polling', async (req, res) => {
    console.log('Starting manual polling and processing...');
    await main(); // Call the main function to initiate manual polling
    res.send('Manual polling initiated.');
});

app.get('/', (req, res) => {
    const status = 'Up'; // Replace with actual status
    const linksProcessed = 100; // Replace with actual number

    const html = `
    <html>
        <head>
            <title>Status Page</title>
        </head>
        <body>
            <h1>Application Status</h1>
            <p>Status: ${status}</p>
            <p>Links Processed: ${linksProcessed}</p>
            <p><a href="/manual-polling">Trigger Manual Polling</a></p> <!-- New link -->
        </body>
    </html>
    `;

    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
