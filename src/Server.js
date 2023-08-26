const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

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
        </body>
    </html>
    `;

    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
