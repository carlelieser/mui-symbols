/**
 * Translates paths based on specified movement and origin coordinates.
 *
 * This function modifies the 'transform' and 'transform-origin' attributes of the parent node
 * of SVG path elements to apply a translation effect.
 *
 * @param {Object} params - The parameters for the translation.
 * @param {Object} params.origin - The origin point for the translation, with 'x' and 'y' properties.
 * @param {Object} params.move - The translation vector, with 'x' and 'y' properties indicating the movement.
 */
export const translatePaths = ({ origin, move }) => ({
	name: "translatePaths",
	fn: () => {
		return {
			element: {
				enter: (node, parentNode) => {
					if (node.name === "path") {
						parentNode.attributes.transform = `${parentNode.attributes.transform ?? ""} translate(${
							move.x
						}, ${move.y})`.trim();
						parentNode.attributes["transform-origin"] = `${origin.x} ${origin.y}`;
					}
				},
			},
		};
	},
});
