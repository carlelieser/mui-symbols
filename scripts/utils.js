import fs from 'fs';
import logSymbols from 'log-symbols';
import cliProgress from 'cli-progress';
import path from 'path';

export const rmdir = async (target, {
	removeRoot = false,
	multibar = null,
	log = console.log,
}) => {
	const sourceFiles = await fs.promises.readdir(target);
	if (sourceFiles.length) {
		log?.(`${logSymbols.info} Directory not empty, cleaning now...`);
		const bar = multibar?.create(sourceFiles.length, 0) ?? new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
		for (const file of sourceFiles) {
			const filePath = path.join(target, file);
			await fs.promises.rm(filePath);
			bar.increment();
		}
		log?.(`${logSymbols.success} Directory cleaned`);
		multibar?.remove(bar);
	} else {
		log?.(`${logSymbols.success} Directory clean`);
	}
	if (removeRoot) await fs.promises.rm(target, { recursive: true, force: true });
};