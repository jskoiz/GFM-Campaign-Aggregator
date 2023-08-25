import axios from 'axios';
import cheerio from 'cheerio';

export async function fetchData(url) {
    try {
        console.log(`Fetching data from ${url}...`);
        const response = await axios.get(url, { maxRedirects: 5 });

        return {
            $: cheerio.load(response.data),
            finalUrl: response.request.res.responseUrl
        };
    } catch (error) {
        console.warn(`Error fetching data from ${url}:`, error.message);
        return null;
    }
}

export function extractData($, url) {
    if (!$) return null;

    const titleElement = $('h1.p-campaign-title');
    const title = titleElement.text().trim();
    console.log(`Extracting data for campaign: "${title}"...`);

    try {
        if (!titleElement.length) throw new Error('Title not found');

        const dataDiv = $('div.progress-meter_progressMeterHeading__7dug0');
        const raisedAmountElement = dataDiv.find('div.hrt-disp-inline');
        if (!raisedAmountElement.length) throw new Error('Raised amount not found');
        const raisedAmount = raisedAmountElement.text().trim();

        const targetAmountRawElement = dataDiv.find('span.hrt-text-body-sm.hrt-text-gray');
        if (!targetAmountRawElement.length) throw new Error('Target amount element not found');
        const targetAmountRaw = targetAmountRawElement.text().trim();

        const targetMatch = targetAmountRaw.match(/\$[\d,]+/);
        if (!targetMatch) throw new Error('Target amount not found');
        const targetAmount = targetMatch[0];

        const imageDivStyle = $('div.a-image.a-image--background').attr('style');
        const imageUrlMatch = imageDivStyle.match(/url\(["']?(.*?)["']?\)/);
        const imageUrl = imageUrlMatch ? imageUrlMatch[1] : null;

        return { title, raisedAmount, targetAmount, imageUrl };
    } catch (error) {
        console.warn(`Error extracting data for campaign: "${title}"`, error.message);
        return null;
    }
}
