/**
 * Translates the paths based on specified movement and origin coordinates.
 *
 * This function modifies the 'transform' and 'transform-origin' attributes of the parent node
 * of SVG path elements to apply a translation effect. It only affects path elements that have
 * a defined 'd' attribute (the draw path command).
 *
 * @param {Object} params - The parameters for the translation.
 * @param {Object} params.origin - The origin point for the translation, with 'x' and 'y' properties.
 * @param {Object} params.move - The translation vector, with 'x' and 'y' properties indicating the movement.
 */
export const translatePaths = ({ origin, move }) => ({
	name: "translatePaths",
	fn: () => {
		let deltaX, deltaY;
		return {
			element: {
				enter: (node, parentNode) => {
					if (node.name === "path") {
						const d = node.attributes.d;

						if (!d) return;

						if (deltaX || deltaY) {
							parentNode.attributes.transform = `${parentNode.attributes.transform ?? ""} translate(${
								move.x
							}, ${move.y})`.trim();
							parentNode.attributes["transform-origin"] = `${origin.x} ${origin.y}`;
						}
					}
				},
			},
		};
	},
});
