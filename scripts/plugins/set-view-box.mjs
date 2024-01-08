/**
 * Set the 'viewBox' attribute for the root SVG. The 'viewBox' attribute is set
 * based on the provided x, y, width, and height parameters.
 *
 * @param {Object} viewBoxParams - The parameters for setting the viewBox attribute.
 * @param {number} viewBoxParams.x - The x-coordinate for the viewBox.
 * @param {number} viewBoxParams.y - The y-coordinate for the viewBox.
 * @param {number} viewBoxParams.width - The width of the viewBox.
 * @param {number} viewBoxParams.height - The height of the viewBox.
 */
export const setViewBox = ({ x, y, width, height }) => ({
	name: "setViewBox",
	fn: () => {
		return {
			root: {
				enter: node => {
					if (node.name === "svg") node.attributes.viewBox = [x, y, width, height].join(" ");
				},
			},
		};
	},
});
