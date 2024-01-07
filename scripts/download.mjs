/**
 * This script automates downloading and processing icons from a GitHub repo.
 * It retrieves the latest icons, extracts them, and formats their names using number-to-word
 * conversions and PascalCase. The processed icons are then saved in specified directory.
 */

import fetch from "node-fetch";
import * as path from "path";
import unzipper from "unzipper";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { replaceNumbersWithWords, toPascalCase } from "./utils.mjs";

const argv = yargs(hideBin(process.argv))
	.option("repo", {
		alias: "r",
		describe:
			'GitHub repo to extract icons from, i.e "marella/material-symbols".',
		type: "string",
	})
	.option("output", {
		alias: "o",
		describe: "Path where icons should be extracted.",
		type: "string",
	})
	.option("extension", {
		alias: "ext",
		describe:
			"The icon extension to match against. Only icons with this extension will be extracted.",
		type: "string",
	})
	.option("sub-dir", {
		alias: "s",
		describe:
			'The sub-directory within the repo where icons should be grabbed from. Default is "svg/400"',
		type: "string",
	}).argv;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repo = argv.repo ?? "marella/material-symbols";
const outDir = argv.output
	? path.resolve(process.cwd() ?? __dirname + "/..", argv.output)
	: path.join(__dirname, "..", "icons");
const ext = argv.extension ?? "svg";
const subDir = argv["sub-dir"] ?? "svg/400";

const releasesURL = `https://api.github.com/repos/${repo}/releases/latest`;
const zipFileName = "download.zip";
const zipFileOutPath = path.join(outDir, zipFileName);

const getZipBallUrl = () => {
	return fetch(releasesURL)
		.then(response => response.json())
		.then(data => data.zipball_url);
};

const downloadSourceZip = url => {
	return new Promise(async resolve => {
		const response = await fetch(url);
		const dest = fs.createWriteStream(zipFileOutPath);
		response.body.on("end", resolve).pipe(dest);
	});
};

const getIconName = (name, style) => {
	const suffix = name.includes("-fill") ? "filled" : "";
	const nameWithoutFill = name.replace("-fill", "");
	const numbersReplaced = replaceNumbersWithWords(nameWithoutFill);
	const normalized = numbersReplaced.replaceAll(/[^a-zA-Z]/g, " ");
	const trimmed = normalized.replaceAll(/\s+/g, " ");
	const withStyleAndSuffix = [trimmed, style, suffix].join(" ");
	return toPascalCase(withStyleAndSuffix);
};

const prepIconPath = iconPath => {
	const filename = path.basename(iconPath, `.${ext}`);
	const style = iconPath.split("/")[3];
	const iconName = getIconName(filename, style);
	return path.join(outDir, `${iconName}.${ext}`);
};

const normalizePath = path => `/${path}/`.replaceAll(/\/+/g, "/");

const isChildOfPath = (parent, child) => child.includes(normalizePath(parent));

const validateEntry = entry => {
	const isFile = entry.type === "File";
	const isInSubDir = isChildOfPath(subDir, entry.path);
	const hasExtension = path.extname(entry.path) === `.${ext}`;

	if (isFile && isInSubDir && hasExtension) {
		const newIconPath = prepIconPath(entry.path);
		entry.pipe(fs.createWriteStream(newIconPath));
	} else {
		entry.autodrain();
	}
};

const extractIcons = async () => {
	return new Promise(resolve => {
		fs.createReadStream(zipFileOutPath)
			.pipe(unzipper.Parse())
			.on("entry", validateEntry)
			.on("close", () => {
				fs.removeSync(zipFileOutPath);
				resolve();
			});
	});
};

const run = async () => {
	await fs.emptyDir(outDir);
	const url = await getZipBallUrl();
	await downloadSourceZip(url);
	await extractIcons();
};

run();
