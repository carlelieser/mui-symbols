import fetch from 'node-fetch';
import * as path from 'path';
import unzipper from 'unzipper';
import { fileURLToPath } from 'url';
import converter from 'number-to-words';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const releasesURL = `https://api.github.com/repos/marella/material-symbols/releases/latest`;
const downloadDir = path.join(__dirname, '..', 'icons');
const zipFileName = 'download.zip';
const zipFileOutPath = path.join(downloadDir, zipFileName);

const getReleaseAssetsURL = () => {
	return fetch(releasesURL)
		.then((response) => response.json())
		.then((data) => data.zipball_url);
};

const downloadSourceZip = (url) => {
	return new Promise(async (resolve) => {
		const response = await fetch(url);
		const dest = fs.createWriteStream(zipFileOutPath);
		response.body.on('end', resolve).pipe(dest);
	});
};

const capitalizeFirstLetterAfterNumberGroup = (string) => {
	const chars = string.split('');
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		if (i === 0) continue;
		if (Number.isNaN(Number(char)) && !Number.isNaN(Number(chars?.[i - 1]))) {
			chars[i] = char.toUpperCase();
		}
	}
	return chars.join('');
};

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const toPascalCase = (string) => string.trim().split(/\W/).map(item => capitalize(item)).join('');

const replaceNumbersWithWords = (string) => {
	const prepped = capitalizeFirstLetterAfterNumberGroup(string);
	const matches = Array.from(string.matchAll(/\d+/g), match => ({
		...match,
	}));

	if (!matches.length) return string;

	const match = matches[0];
	const numbers = match[0];
	const words = converter.toWords(numbers);
	const result = words + prepped.slice(match.index + numbers.length);

	return replaceNumbersWithWords(result);
};

const getIconName = (name, style) => {
	const suffix = name.includes('-fill') ? 'filled' : '';
	const nameWithoutFill = name.replace('-fill', '');
	const numbersReplaced = replaceNumbersWithWords(nameWithoutFill);
	const normalized = numbersReplaced.replaceAll(/[^a-zA-Z]/g, ' ');
	const trimmed = normalized.replaceAll(/\s+/g, ' ');
	const withStyleAndSuffix = [trimmed, style, suffix].join(' ');
	return toPascalCase(withStyleAndSuffix);
};

const prepIconPath = (iconPath) => {
	const filename = path.basename(iconPath, '.svg');
	const style = iconPath.split('/')[3];
	const iconName = getIconName(filename, style);
	return path.join(downloadDir, `${iconName}.svg`);
}

const validateEntry = entry => {
	const isFile = entry.type === 'File';
	const isSVG = path.extname(entry.path) === '.svg';
	const isTargetWeight = entry.path.includes('/svg/400/');

	if (isFile && isSVG && isTargetWeight) {
		const newIconPath = prepIconPath(entry.path);
		entry.pipe(fs.createWriteStream(newIconPath));
	} else {
		entry.autodrain();
	}
}

const extractIcons = async () => {
	return new Promise((resolve) => {
		fs.createReadStream(zipFileOutPath)
			.pipe(unzipper.Parse())
			.on('entry', validateEntry)
			.on('close', async () => {
				await fs.remove(zipFileOutPath);
				resolve();
			});
	});
};


const run = async () => {
	await fs.emptyDir(downloadDir);
	const url = await getReleaseAssetsURL();
	await downloadSourceZip(url);
	await extractIcons();
};

run();