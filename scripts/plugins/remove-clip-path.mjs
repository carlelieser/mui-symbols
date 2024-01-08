/**
 * Removes 'clipPath' elements and 'clipPath' attributes from SVG elements.
 *
 */
export const removeClipPath = {
	name: "removeClipPath",
	fn: () => {
		return {
			element: {
				enter: (node, parentNode) => {
					const isClipPath = node.name === "clip-path" || node.name === "clipPath";
					const clipPathAttribute = node.attributes["clipPath"];
					if (!isClipPath && !clipPathAttribute) return;
					if (isClipPath) parentNode.children = parentNode.children.filter(child => child !== node);
					if (clipPathAttribute) delete node.attributes["clipPath"];
				},
			},
		};
	},
};
