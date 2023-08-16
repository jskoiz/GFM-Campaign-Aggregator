# GFM Campaign Aggregator
The GFM Campaign Aggregator is a tool designed to process GoFundMe campaign links from an Excel or CSV file and gather key details about each campaign. It fetches the current raised amount, the total fundraising goal, and the campaign picture for each link provided.

## Features
- **Input Formats**: Accepts both Excel and CSV files.
- **Output Format**: Produces a detailed Excel sheet with the gathered data.
- **Concurrency Control**: Processes multiple links concurrently for faster results.

## Installation
You can install the required dependencies using your preferred package manager:

`npm install`
`yarn install`
`pnpm install`


## How to Use
1. Ensure your input file (Excel or CSV) is named `source` (like `source.xlsx` or `source.csv`). 
2. Place all the GoFundMe campaign links in column A of this file.
3. Run the tool: `node main`.

## Deploy to Repl.it
[![Run on Repl.it](https://replit.com/badge/github/jskoiz/GFM-Campaign-Aggregator)](https://replit.com/new/github/jskoiz/GFM-Campaign-Aggregator)

## Configuration
- **Speed and Scope**: Adjust the `CONCURRENT_LIMIT` in the script to control how many links are processed at once. A higher number will be faster but may require more system resources.

## Dependencies and Their Roles
- **axios**: Used for making HTTP requests to fetch campaign pages.
- **cheerio**: Allows for quick and efficient parsing of the fetched HTML, making it easier to extract specific details from the campaign pages.
- **exceljs**: Enables reading from and writing to Excel files. This is crucial for input and output operations.
- **csv-parser**: Assists in parsing CSV files, making it possible to use CSV as an input format.
- **url**: Used to validate URLs from the input file.

## Notes
- Ensure you have a stable internet connection for optimal performance.
- The tool is designed to be gentle on the GoFundMe servers. Adjusting the concurrency limit to a very high value might result in IP bans or rate limits. Always use responsibly.

## License
MIT

