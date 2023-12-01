import fs from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logFilePath = path.join(__dirname, '..', 'log.txt'); 

const logFile = fs.createWriteStream(logFilePath, { flags: 'w' });
const logStdout = process.stdout;

console.log = function (...args) {
  logFile.write(util.format(...args) + '\n');
  logStdout.write(util.format(...args) + '\n');
};
console.error = console.log;
