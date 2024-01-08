/**
 * Scales 'path' elements by a specified factor.
 *
 * This function applies a scaling transformation to each 'path' element in an SVG.
 * The scaling is uniform and is determined by the provided factor. Only 'path' elements
 * with a defined 'd' attribute (the path data) are scaled. The scaling is appended to
 * any existing 'transform' attribute of the parent node, allowing for cumulative transformations.
 *
 * @param {number} factor - The scaling factor to be applied to the path elements.
 */
export const scalePaths = factor => ({
	name: "scalePaths",
	fn: () => {
		let scale;
		return {
			element: {
				enter: (node, parentNode) => {
					if (node.name === "path") {
						if (!node.attributes.d) return;
						parentNode.attributes.transform = `${parentNode.attributes.transform ?? ""} scale(${factor})`;
					}
				},
			},
		};
	},
});
