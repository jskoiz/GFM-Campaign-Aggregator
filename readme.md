# GFM Campaign Aggregator
The GFM Campaign Aggregator is a Node.js-based tool designed to process GoFundMe campaign links from an Airtable base. It fetches key details like the current raised amount, the total fundraising goal, and the campaign picture for each link provided. This tool is particularly useful for organizations and initiatives aiming to aggregate and analyze crowdfunding campaign data.


## Purpose
This tool was created to support [Help Maui Rise](https://www.helpmauirise.org/), a Direct-to-’Ohana initiative focused on equitable distribution of funds to those displaced by Maui fires of 2023. 

## Features
- **Input Formats**: Process links within an Airtable Base
- **Output Format**: Produces a detailed table with the gathered data.
- **Concurrency Control**: Processes multiple links concurrently for faster results.

## Prerequisites

- Node.js (v12 or higher)
- An Airtable account with API access
- Basic understanding of JavaScript and Node.js environments

## Installation

1. Clone the repository to your local machine:
   `git clone https://github.com/jskoiz/GFM-Campaign-Aggregator`
2. Navigate to the project directory:
   `cd GFM-Campaign-Aggregator`
3. Install the dependencies:
   `npm install` or `yarn install` or `pnpm install`

## How to Use

1. Set up your Airtable base with a table named 'Link Source List' and a column for URLs.
2. Create a `.env` file in the project root with the following content:
    `AIRTABLE_API_KEY=your_airtable_api_key`
    `AIRTABLE_BASE_ID=your_airtable_base_id`
3. Place all the GoFundMe campaign links in the 'Link Source List' table in your Airtable base.
4. Run the tool using the command: `node main.js`


## Configuration
- **Speed and Scope**: Adjust the `CONCURRENT_LIMIT` in the script to control how many links are processed at once. A higher number will be faster but may require more system resources.

## Dependencies and Their Roles
- **axios**: Used for making HTTP requests to fetch campaign pages.
- **cheerio**: Allows for quick and efficient parsing of the fetched HTML, making it easier to extract specific details from the campaign pages.
- **url**: Used to validate URLs from the input file.

## Notes
- Ensure you have a stable internet connection for optimal performance.
- The tool is designed to be gentle on the GoFundMe servers. Adjusting the concurrency limit to a very high value might result in IP bans or rate limits. Always use responsibly.

## License
MIT

