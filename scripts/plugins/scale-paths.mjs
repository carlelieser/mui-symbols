export const scalePaths = (from, to) => ({
	name: "scalePaths",
	description: "Scale all paths to the provided size.",
	fn: () => {
		let scale;
		return {
			element: {
				enter: node => {
					if (node.name === "svg")
						scale = Number((to / from).toFixed(4));
					if (node.name === "path")
						node.attributes.transform = `scale(${scale}, ${scale})`;
				},
			},
		};
	},
});
