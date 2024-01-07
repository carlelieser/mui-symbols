export const resetViewBox = size => ({
	name: "resizeViewBox",
	description: "Reset view box coordinates and set size to specified amount.",
	fn: () => {
		return {
			element: {
				enter: node => {
					if (node.name === "svg")
						node.attributes.viewBox = `0 0 ${size} ${size}`;
				},
			},
		};
	},
});
