import axios from 'axios';
import cheerio from 'cheerio';

let isFetchingPaused = false;

async function pauseFetching(delay) {
    isFetchingPaused = true;
    console.log(`Pausing fetching for ${delay / 1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    isFetchingPaused = false;
}

async function fetchURL(url, index, totalCount) {
    if (!url.includes('gofund')) {
        console.log(`Skipping non-GoFundMe URL: ${url}`);
        return null;
    }
    console.log(`[${index + 1}/${totalCount}] Fetching data from ${url}...`);
    return await axios.get(url, { maxRedirects: 5 });
}

function processResponse(response, url) {
    return {
        $: cheerio.load(response.data),
        finalUrl: response.request.res.responseUrl,
        status: 'success'
    };
}

async function handleFetchError(error, url, index, totalCount, retryCount) {
    if (error.response && error.response.status === 403) {
        if (retryCount >= 2) {
            console.error("Encountered 403 error for the third time. Exiting process.");
            process.exit(1);
        }
        const waitTime = (60 * (retryCount + 1)) * 1000;
        await pauseFetching(waitTime);
        return fetchDataWithBackoff(url, index, totalCount, retryCount + 1);
    }
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
}

async function fetchDataWithBackoff(url, index, totalCount, retryCount = 0) {
    if (isFetchingPaused) {
        console.log(`Fetching is currently paused. Waiting before trying ${url} again...`);
        await pauseFetching(60000);
    }

    try {
        const response = await fetchURL(url, index, totalCount);
        if (!response) return null;
        return processResponse(response, url);
    } catch (error) {
        return await handleFetchError(error, url, index, totalCount, retryCount);
    }
}

export function extractData($, url) {
    if (!$) return null;

    try {
        const titleElement = $('h1.p-campaign-title');
        if (!titleElement.length) throw new Error('Title not found');
        const title = titleElement.text().trim();
        console.log(`Extracting data for campaign: "${title}"...`);

        const data = extractCampaignData($, title);
        return { ...data, goFundMeLink: url };
    } catch (error) {
        console.warn(`Error extracting data for campaign: "${title}"`, error.message);
        return null;
    }
}

function extractCampaignData($, title) {
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

    const teamAvatarDiv = $('div.hrt-team-avatar.hrt-avatar.hrt-avatar--small');
    const teamFundraiser = teamAvatarDiv.length ? 'Yes' : 'No';

    const descriptionDiv = $('div.o-campaign-story.hrt-mt-3');
    const description = descriptionDiv.find('div').map((_, el) => $(el).text().trim()).get().join('\n\n');

    return {
        title,
        raisedAmount,
        targetAmount,
        imageUrl,
        teamFundraiser,
        description,
    };
}

export const fetchData = fetchDataWithBackoff;
