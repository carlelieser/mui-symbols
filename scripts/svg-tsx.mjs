/**
 * This script automates the conversion of SVG icons to TSX components. The script reads SVG files from the 'icons' directory, parses
 * them, and uses a template to generate corresponding TSX files in the 'src' directory. It also creates
 * an index file in 'src' for easy export of all components. The script also ensures that the 'src' directory
 * is emptied before generating new components.
 */

import path from "path";
import { fileURLToPath } from "url";
import fg from "fast-glob";
import fs from "fs-extra";
import PQueue from "p-queue";
import * as svgo from "svgo";
import { camelCaseAttributes } from "./plugins/camel-case-attributes.mjs";
import { removeClipPath } from "./plugins/remove-clip-path.mjs";
import { svgAsReactFragment } from "./plugins/svg-as-react-fragment.mjs";
import { setViewBox } from "./plugins/set-view-box.mjs";
import { translatePaths } from "./plugins/translate-paths.mjs";
import { scalePaths } from "./plugins/scale-paths.mjs";
import { groupPaths } from "./plugins/group-paths.mjs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).option("style", {
	alias: "s",
	describe:
		"Sets the default style for the components. Choose from 'outlined', 'rounded', 'sharp'. Additionally, 'filled' can be appended to specify the filled alternative of a style as the default, i.e 'roundedfilled'. Components will be named without including this style in the name. Default is 'outlinedfilled'.",
	type: "string",
}).argv;

const ext = "svg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "..");
const templatePath = path.join(root, "template.js");
const destPath = path.join(root, "src");

const queue = new PQueue({ concurrency: 8 });
const iconSize = 24;
const defaultStyle = argv.style ?? "outlinedfilled";

const cleanPaths = data => {
	const input = data
		.replace(/ fill="#010101"/g, "")
		.replace(/<rect fill="none" width="24" height="24"\/>/g, "")
		.replace(/<rect id="SVGID_1_" width="24" height="24"\/>/g, "");

	let childrenAsArray = false;

	const result = svgo.optimize(input, {
		floatPrecision: 4,
		multipass: true,
		plugins: [
			{ name: "cleanupAttrs" },
			{ name: "removeDoctype" },
			{ name: "removeXMLProcInst" },
			{ name: "removeComments" },
			{ name: "removeMetadata" },
			{ name: "removeTitle" },
			{ name: "removeDesc" },
			{ name: "removeUselessDefs" },
			{ name: "removeEditorsNSData" },
			{ name: "removeEmptyAttrs" },
			{ name: "removeHiddenElems" },
			{ name: "removeEmptyText" },
			{ name: "removeViewBox" },
			{ name: "cleanupEnableBackground" },
			{ name: "minifyStyles" },
			{ name: "convertStyleToAttrs" },
			{ name: "convertColors" },
			{ name: "convertPathData" },
			{ name: "convertTransform" },
			{ name: "removeUnknownsAndDefaults" },
			{ name: "removeNonInheritableGroupAttrs" },
			{
				name: "removeUselessStrokeAndFill",
				params: {
					removeNone: true,
				},
			},
			{ name: "removeUnusedNS" },
			{ name: "cleanupIds" },
			{ name: "cleanupNumericValues" },
			{ name: "cleanupListOfValues" },
			{ name: "moveElemsAttrsToGroup" },
			{ name: "moveGroupAttrsToElems" },
			{ name: "collapseGroups" },
			{ name: "removeRasterImages" },
			{ name: "mergePaths" },
			{ name: "convertShapeToPath" },
			{ name: "sortAttrs" },
			{ name: "removeDimensions" },
			{ name: "removeElementsByAttr" },
			{ name: "removeStyleElement" },
			{ name: "removeScriptElement" },
			{ name: "removeEmptyContainers" },
		],
	});

	let { data: paths } = svgo.optimize(result.data, {
		plugins: [
			removeClipPath,
			groupPaths,
			scalePaths(iconSize / 960),
			translatePaths({
				origin: {
					x: 0,
					y: -960,
				},
				move: {
					x: 0,
					y: 960,
				},
			}),
			setViewBox({
				x: 0,
				y: 0,
				width: iconSize,
				height: iconSize,
			}),
			svgAsReactFragment({
				onChildrenAsArray: () => (childrenAsArray = true),
			}),
			camelCaseAttributes,
		],
	});

	if (childrenAsArray) {
		const pathsCommaSeparated = paths.replace(/key="\d+" \/>/g, "$&,").replace(/<\/SVGChild:(\w+)>/g, "</$1>,");
		paths = `[${pathsCommaSeparated}]`;
	}

	paths = paths.replace(/SVGChild:/g, "");

	return paths;
};

const getIconFiles = () => fg(`icons/*.${ext}`);

const getTemplate = () => fs.readFile(templatePath, { encoding: "utf-8" });

const createComponentWithDefaultStyle = async (filePath, name) => {
	const normalizedDefaultStyle = defaultStyle.toLowerCase();
	const normalizedName = name.toLowerCase();
	const shouldCreate = normalizedName.includes(normalizedDefaultStyle);

	if (shouldCreate)
		await toTSX(filePath, name.replace(new RegExp(defaultStyle, "gi"), ""));
}

const toTSX = async (filePath, name = path.basename(filePath, `.${ext}`)) => {
	await createComponentWithDefaultStyle(filePath, name);

	const data = await fs.readFile(filePath, { encoding: "utf-8" });
	const paths = cleanPaths(data);
	const template = await getTemplate();
	const content = template.replace("{{{paths}}}", paths).replace("{{componentName}}", name);
	const outPath = path.join(destPath, name + ".tsx");

	await fs.outputFile(outPath, content, { encoding: "utf-8" });
};

const generateComponents = async () => {
	const files = await getIconFiles();
	await queue.addAll(files.map(path => () => toTSX(path)));
};

const generateIndex = async () => {
	const files = await fg("src/*.tsx");
	const names = files.map(filePath => path.basename(filePath, ".tsx"));
	const content = names.map(name => `export { default as ${name} } from "./${name}";`).join("\n");
	const outPath = path.join(destPath, "index.ts");

	await fs.outputFile(outPath, content, { encoding: "utf-8" });
};

const clean = () => fs.emptyDir(destPath);

const run = async () => {
	await clean();
	await generateComponents();
	await generateIndex();
};

run();
