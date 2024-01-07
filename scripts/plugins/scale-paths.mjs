export const scalePaths = (from, to) => ({
	name: "scalePaths",
	description: "Adjust path sizes based on the ratio of the provided values.",
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
