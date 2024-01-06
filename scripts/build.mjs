import path from 'path';
import { parse } from 'svgson';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';
import fs from 'fs-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;

const ext = argv.ext ?? "svg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '..', 'template.js');
const srcPath = path.join(__dirname, '..', 'src');

const getIconFiles = () => fg(`icons/*.${ext}`);

const getTemplate = () => fs.readFile(templatePath, { encoding: 'utf-8' });

const toTSX = async (filePath) => {
	const name = path.basename(filePath, `.${ext}`);
	const svg = await fs.readFile(filePath, { encoding: 'utf-8' });
	const parsedSVG = await parse(svg);
	const d = parsedSVG.children?.[0].attributes.d;
	const template = await getTemplate();
	const data = template.replace('{{d}}', d).replace('{{name}}', name);
	const outPath = path.join(srcPath, name + '.tsx');
	await fs.outputFile(outPath, data, { encoding: 'utf-8' });
};

const generateComponents = async () => {
	const files = await getIconFiles();
	await Promise.all(files.map(toTSX));
};

const generateIndex = async () => {
	const files = await getIconFiles();
	const names = files.map(filePath => path.basename(filePath, `.${ext}`));
	const content = names.map(name => `export { default as ${name} } from "./${name}";`).join('\n');
	const outPath = path.join(srcPath, 'index.ts');
	await fs.outputFile(outPath, content, { encoding: 'utf-8' });
};

const run = async () => {
	await fs.emptyDir(srcPath);
	await generateComponents();
	await generateIndex();
};

run();