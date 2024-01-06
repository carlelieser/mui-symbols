import path from 'path';
import * as fs from 'fs';
import { parse } from 'svgson';
import cliProgress from 'cli-progress';
import logSymbols from 'log-symbols';
import { fileURLToPath } from 'url';
import { rmdir } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, '..', 'svg');
const targetPath = path.join(__dirname, '..', 'src');

const getIcons = async () => (await fs.promises.readdir(sourcePath)).map(name => ({
	path: path.join(sourcePath, name),
	name: path.basename(name, '.svg'),
}));

const generateTSFiles = async () => {
	const bar = new cliProgress.SingleBar({
		format: '[{bar}] | {value}/{total} | {icon}',
	}, cliProgress.Presets.shades_classic);
	const icons = await getIcons();
	bar.start(icons.length, 0);
	for (const icon of icons) {
		bar.increment(1, {
			icon: icon.name,
		});
		const svg = await fs.promises.readFile(icon.path, { encoding: 'utf-8' });
		const data = await parse(svg);
		const d = data.children?.[0].attributes.d;
		await fs.promises.writeFile(path.join(targetPath, icon.name + '.tsx'), `
		import { createSvgIcon } from '@mui/material';
		export default createSvgIcon(<path d="${d}"/>, "${icon.name}")`, { encoding: 'utf-8' });
	}
	bar.stop();
	console.log(logSymbols.success, 'Icon components generated');
};

const generateIndex = async () => {
	const icons = await getIcons();
	let content = '';
	for (const icon of icons) content += `export {default as ${icon.name}} from "./${icon.name}"\n`;
	await fs.promises.writeFile(path.join(targetPath, 'index.ts'), content, {
		encoding: 'utf-8',
	});
	console.log(logSymbols.success, 'Index generated');
};

const run = async () => {
	await rmdir(targetPath, {
		removeRoot: true
	});
	await fs.promises.mkdir(targetPath);
	await generateTSFiles();
	await generateIndex();
};

run();