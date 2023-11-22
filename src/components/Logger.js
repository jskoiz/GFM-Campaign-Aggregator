import fs from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construct the absolute path for log.txt in the repository directory
const logFilePath = path.join(__dirname, '..', 'log.txt'); // Adjust the path as necessary

const logFile = fs.createWriteStream(logFilePath, { flags: 'w' });
const logStdout = process.stdout;

console.log = function (...args) {
  logFile.write(util.format(...args) + '\n');
  logStdout.write(util.format(...args) + '\n');
};
console.error = console.log;
