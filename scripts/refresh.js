import fetch from 'node-fetch';
import logSymbols from 'log-symbols';
import cliProgress from 'cli-progress';
import * as path from 'path';
import * as fs from 'fs';
import unzipper from 'unzipper';
import { capitalize } from '@mui/material';
import { fileURLToPath } from 'url';
import converter from 'number-to-words';
import { rmdir } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const owner = 'marella';
const repo = 'material-symbols';
const styleCountSourcePath = 'svg/400';
const styleCountSourceURL = `https://api.github.com/repos/${owner}/${repo}/contents/${styleCountSourcePath}`;
const iconCountSourcePath = 'svg/400/outlined';
const iconCountSourceURL = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=true`;
const releasesURL = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
const sourceDir = path.join(__dirname, '..', 'svg');
const zipFileName = 'download.zip';
const outputPath = path.join(sourceDir, zipFileName);

const multibar = new cliProgress.MultiBar({}, cliProgress.Presets.shades_classic);

const log = (message) => {
	const date = new Date();
	multibar.log(`[${date.toLocaleDateString()}] [${date.toLocaleTimeString()}] ${message} \n`);
};

const getReleaseAssetsURL = () => {
	return fetch(releasesURL)
		.then((response) => response.json())
		.then((data) => data.zipball_url);
};

const downloadSourceZIP = (url) => {
	return new Promise(async (resolve) => {
		log(`${logSymbols.info} Downloading icons...`);

		const response = await fetch(url);
		const progress = multibar.create(0, 0, {}, {
			format: '[{bar}] | {value} MB',
		});
		const dest = fs.createWriteStream(outputPath);

		let downloaded = 0;

		response.body
			.on('end', () => {
				log(`${logSymbols.success} Finished downloading icons`);
				multibar.remove(progress);
				resolve();
			})
			.on('data', (chunk) => {
				downloaded += chunk.length;
				progress.update(Number((downloaded / 1000000).toFixed(2)));
			})
			.pipe(dest);
	});
};

const getIconStyles = () => {
	return fetch(styleCountSourceURL)
		.then(response => response.json())
		.then((entries) => entries.filter((entry) => entry.type === 'dir').map((entry) => entry.name));
};

const getDefaultIcons = () => {
	return fetch(iconCountSourceURL)
		.then(response => response.json())
		.then((entries) => entries.tree.filter(item => item.path.startsWith(iconCountSourcePath)));
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


const replaceDigitsWithWordEquivalent = (textWithNumbers) => {
	textWithNumbers = capitalizeFirstLetterAfterNumberGroup(textWithNumbers);

	const chars = textWithNumbers.split('');
	const matches = Array.from(textWithNumbers.matchAll(/\d+/g), match => ({
		...match,
	}));

	if (!matches.length) return textWithNumbers;

	let result = '';
	let index = null;

	for (let i = 0; i < chars.length; i++) {
		let char = chars[i];
		const isNumber = !Number.isNaN(Number(char));
		if (i === index) index = null;

		if (isNumber) {
			if (index) {
				if (i < index) {
					continue;
				}
			}
			const match = matches.find((match) => match.index === i);
			const replacement = converter.toWords(match[0]);
			index = i + match[0].length;
			char = replacement;
		}

		result += char;
	}

	return result;
};

const generateIconName = (name, style) => {
	const isFill = name.includes('-fill');
	const nameWithoutFill = name.replace('-fill', '');
	const numbersReplaced = replaceDigitsWithWordEquivalent(nameWithoutFill);
	const normalized = numbersReplaced.replaceAll(/[^a-zA-Z]/g, ' ');
	const trimmed = normalized.replaceAll(/\s+/g, ' ');
	const inPascalCase = trimmed.split(/\s/).map(item => capitalize(item)).join('');
	return inPascalCase + (capitalize(style)) + (isFill ? 'Filled' : '');
};

const extractIcons = async (total) => {
	return new Promise((resolve) => {
		log(`${logSymbols.info} Extracting icons...`);

		const stream = fs.createReadStream(outputPath);
		const bar = multibar.create(total, 0, {
			style: 'outlined',
			filename: '10k-fill.svg',
		}, {
			format: '[{bar}] | {style} | {filename}',
		});

		stream
			.pipe(unzipper.Parse())
			.on('entry', (entry) => {
				const filename = path.basename(entry.path, '.svg');
				if (entry.path.includes('/svg/400/') && entry.type === 'File' && path.extname(entry.path) === '.svg') {
					const style = entry.path.split('/')[3];
					const name = generateIconName(filename, style);
					const output = `${name}.svg`;
					bar.increment(1, {
						filename: filename,
						style,
					});
					entry.pipe(fs.createWriteStream(path.join(sourceDir, output)));
				} else {
					entry.autodrain();
				}
			})
			.on('close', async () => {
				log(`${logSymbols.success} Finished extracting icons`);
				log(`${logSymbols.info} Removing source ZIP...`);
				await fs.promises.rm(outputPath, { force: true });
				log(`${logSymbols.success} Source ZIP removed`);
				multibar.remove(bar);
				resolve();
			});
	});
};


const run = async () => {
	await rmdir(sourceDir, {
		multibar,
		log,
	});
	const url = await getReleaseAssetsURL();
	const styles = await getIconStyles();
	const icons = await getDefaultIcons();
	await downloadSourceZIP(url);
	await extractIcons(icons.length * styles.length);
	multibar.stop();
	process.exit();
};

run();