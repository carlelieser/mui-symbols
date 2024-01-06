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

const ext = "svg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "..");
const templatePath = path.join(root, "template.js");
const destPath = path.join(root, "src");

const utilName = "create-svg-icon.js";
const utilSourcePath = path.join(root, utilName);
const utilDestPath = path.join(destPath, utilName);

const queue = new PQueue({ concurrency: 8 });

const cleanPaths = data => {
	const input = data
		.replace(/ fill="#010101"/g, "")
		.replace(/<rect fill="none" width="24" height="24"\/>/g, "")
		.replace(/<rect id="SVGID_1_" width="24" height="24"\/>/g, "");

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

	let childrenAsArray = false;
	const jsxResult = svgo.optimize(result.data, {
		plugins: [
			{
				name: "svgAsReactFragment",
				fn: () => {
					return {
						root: {
							enter(root) {
								const [svg, ...rootChildren] = root.children;
								if (rootChildren.length > 0) {
									throw new Error(
										"Expected a single child of the root"
									);
								}
								if (
									svg.type !== "element" ||
									svg.name !== "svg"
								) {
									throw new Error(
										"Expected an svg element as the root child"
									);
								}

								if (svg.children.length > 1) {
									childrenAsArray = true;
									svg.children.forEach((svgChild, index) => {
										svgChild.attributes.key = index;
										svgChild.name = `SVGChild:${svgChild.name}`;
									});
								}

								root.children = svg.children;
							},
						},
					};
				},
			},
		],
	});

	let paths = jsxResult.data
		.replace(/"\/>/g, '" />')
		.replace(/fill-opacity=/g, "fillOpacity=")
		.replace(/xlink:href=/g, "xlinkHref=")
		.replace(/clip-rule=/g, "clipRule=")
		.replace(/fill-rule=/g, "fillRule=")
		.replace(/ clip-path=".+?"/g, "")
		.replace(/<clipPath.+?<\/clipPath>/g, "");

	const size = 960;
	const scale = Number(24 / size).toFixed(4);
	paths = paths.replace('clipPath="url(#b)" ', "");
	paths = paths.replace(
		/<path /g,
		`<path transform="scale(${scale}, ${scale})" `
	);

	if (childrenAsArray) {
		const pathsCommaSeparated = paths
			.replace(/key="\d+" \/>/g, "$&,")
			.replace(/<\/SVGChild:(\w+)>/g, "</$1>,");
		paths = `[${pathsCommaSeparated}]`;
	}
	paths = paths.replace(/SVGChild:/g, "");

	return paths;
};

const getIconFiles = () => fg(`icons/*.${ext}`);

const getTemplate = () => fs.readFile(templatePath, { encoding: "utf-8" });

const toTSX = async filePath => {
	const name = path.basename(filePath, `.${ext}`);
	const data = await fs.readFile(filePath, { encoding: "utf-8" });
	const paths = cleanPaths(data);
	const template = await getTemplate();
	const content = template
		.replace("{{{paths}}}", paths)
		.replace("{{componentName}}", name);
	const outPath = path.join(destPath, name + ".tsx");
	await fs.outputFile(outPath, content, { encoding: "utf-8" });
};

const generateComponents = async () => {
	const files = await getIconFiles();
	await queue.addAll(files.map(path => () => toTSX(path)));
};

const generateIndex = async () => {
	const files = await getIconFiles();
	const names = files.map(filePath => path.basename(filePath, `.${ext}`));
	const content = names
		.map(name => `export { default as ${name} } from "./${name}";`)
		.join("\n");
	const outPath = path.join(destPath, "index.ts");
	await fs.outputFile(outPath, content, { encoding: "utf-8" });
};

const clean = () => fs.emptyDir(destPath);

const copyUtil = () => fs.copy(utilSourcePath, utilDestPath);

const run = async () => {
	await clean();
	await generateComponents();
	await generateIndex();
	await copyUtil();
};

run();
