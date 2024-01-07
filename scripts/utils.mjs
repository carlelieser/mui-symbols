import converter from "number-to-words";

export const capitalize = string =>
	string.charAt(0).toUpperCase() + string.slice(1);

export const toCamelCase = string =>
	string.charAt(0).toLowerCase() +
	string
		.split(/\W/)
		.map((item, index) => (index !== 0 ? capitalize(item) : item))
		.join("")
		.slice(1);

export const toPascalCase = string =>
	string
		.trim()
		.split(/\W/)
		.map(item => capitalize(item))
		.join("");

export const capitalizeFirstLetterAfterNumberGroup = string => {
	const chars = string.split("");
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		if (i === 0) continue;
		if (
			Number.isNaN(Number(char)) &&
			!Number.isNaN(Number(chars?.[i - 1]))
		) {
			chars[i] = char.toUpperCase();
		}
	}
	return chars.join("");
};

export const replaceNumbersWithWords = string => {
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

export const parseViewBox = (viewBox, callback) => {
	if (!viewBox)
		throw new Error("Failed to parse viewBox. None was provided.");
	const values = viewBox.split(/\s/g).map(Number);
	const [x, y] = values.slice(0, 2);
	const [width, height] = values.slice(2);
	callback({
		x,
		y,
		width,
		height,
	});
};

export const tryGetViewBox = (viewBox, callback) => {
	if (!viewBox) throw new Error("Missing viewBox attribute in root.");
	callback(viewBox);
};
