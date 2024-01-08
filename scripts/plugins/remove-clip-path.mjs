export const removeClipPath = {
	name: "removeClipPath",
	description: "Remove all clip-path attributes and elements.",
	fn: () => {
		return {
			element: {
				enter: (node, parentNode) => {
					const isClipPath =
						node.name === "clip-path" || node.name === "clipPath";
					const clipPathAttribute = node.attributes["clipPath"];
					if (!isClipPath && !clipPathAttribute) return;
					if (isClipPath)
						parentNode.children = parentNode.children.filter(
							child => child !== node
						);
					if (clipPathAttribute) delete node.attributes["clipPath"];
				},
			},
		};
	},
};
