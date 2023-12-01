import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Airtable from 'airtable';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mkdir = promisify(fs.mkdir);

const folderExists = async (folderPath) => {
    try {
        await fs.promises.access(folderPath);
        return true;
    } catch (error) {
        return false;
    }
};

const downloadImage = async (url, filepath) => {
    try {
        console.log(`Starting download for: ${url}`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    console.log(`Download completed for: ${filepath}`);
                    resolve(true);
                }
            });
        });
    } catch (error) {
        console.error(`Error downloading image from ${url}:`, error.message);
        throw error; 
    }
};

const downloadPhotosConcurrently = async (records) => {
    const concurrencyLimit = 10; 
    const recordChunks = [];
    
    for (let i = 0; i < records.length; i += concurrencyLimit) {
        recordChunks.push(records.slice(i, i + concurrencyLimit));
    }

    let totalCompleted = 0;
    let totalSkipped = 0;
    let totalDuplicates = 0;

    for (const chunk of recordChunks) {
        await Promise.all(chunk.map(async (record, index) => {
            const title = record.get('Title');
            const pictures = record.get('Picture');
            const qrCode = record.get('QR Code');

            if (!title) {
                console.log('Skipping record with missing title.');
                return;
            }

            const rowNumber = index + 1; 

            const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
            const baseName = `${rowNumber}_${sanitizedTitle}`;
            const directoryName = await findAvailableDirectoryName(baseName);

            if (!directoryName) {
                console.log(`No available directory name found for '${title}', skipping.`);
                return;
            }

            const directoryPath = path.join(__dirname, 'photo-download', directoryName);

            try {
                if (await folderExists(directoryPath)) {
                    totalDuplicates++;
                    const duplicateName = `${directoryName}-${totalDuplicates}`;
                    const newDirectoryPath = path.join(__dirname, 'photo-download', duplicateName);
                    console.log(`Directory already exists, renaming to: ${newDirectoryPath}`);
                    await mkdir(newDirectoryPath, { recursive: true });
                    directoryPath = newDirectoryPath;
                } else {
                    console.log(`Creating directory: ${directoryPath}`);
                    await mkdir(directoryPath, { recursive: true });
                }

                const pictureUrl = pictures && pictures.length > 0 ? pictures[0].url : null;
                const qrCodeUrl = qrCode && qrCode.length > 0 ? qrCode[0].url : null;

                if (pictureUrl) {
                    const pictureFilePath = path.join(directoryPath, 'photo.jpg');
                    console.log(`Downloading picture to: ${pictureFilePath}`);
                    await downloadImage(pictureUrl, pictureFilePath);
                }

                if (qrCodeUrl) {
                    const qrCodeFilePath = path.join(directoryPath, 'qr_code.jpg');
                    console.log(`Downloading QR Code to: ${qrCodeFilePath}`);
                    await downloadImage(qrCodeUrl, qrCodeFilePath);
                }

                totalCompleted++;
            } catch (error) {
                console.error(`Error processing record for '${title}':`, error.message);
            }
        }));
    }

    console.log(`Total completed downloads: ${totalCompleted}`);
    console.log(`Total skipped downloads: ${totalSkipped}`);
    console.log(`Total duplicates handled: ${totalDuplicates}`);
};

const findAvailableDirectoryName = async (baseName) => {
    let directoryName = baseName;
    let index = 1;

    while (await folderExists(path.join(__dirname, 'photo-download', directoryName))) {
        index++;
        directoryName = `${baseName}-${index}`;
    }

    return directoryName;
};

const downloadPhotos = async () => {
    console.log('Initializing Airtable API...');
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const base = new Airtable({ apiKey }).base(baseId);

    try {
        console.log('Fetching records from Airtable...');
        const records = await base('Family Details').select().all();
        console.log(`Fetched ${records.length} records from Airtable.`);

        await downloadPhotosConcurrently(records);

        console.log('All photos downloaded.');
    } catch (error) {
        console.error('Error downloading photos:', error);
    }
};

downloadPhotos();
