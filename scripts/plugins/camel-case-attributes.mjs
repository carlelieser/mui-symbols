import { toCamelCase } from "../utils.mjs";

/**
 * Converts all attribute names to camelCase.
 *
 */
export const camelCaseAttributes = {
	name: "camelCaseAttributes",
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
