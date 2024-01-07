import { toCamelCase } from "../utils.mjs";

export const camelCaseAttributes = {
	name: "camelCaseAttributes",
	description: "Converts attribute names to camel case.",
	fn: () => {
		return {
			element: {
				enter: node => {
					Object.keys(node.attributes).forEach(name => {
						const value = node.attributes[name];
						delete node.attributes[name];
						node.attributes[toCamelCase(name)] = value;
					});
				},
			},
		};
	},
};
