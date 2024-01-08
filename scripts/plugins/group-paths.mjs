/**
 * Groups each 'path' element in an SVG into a separate 'g' (group) element.
 *
 * This function iterates over the child nodes of a given parent node. If a child node is
 * a 'path' element, it is wrapped in a new 'g' element. This effectively groups each path
 * into its own group, allowing for easier manipulation and styling of individual paths.
 * Other attributes of the path are preserved, but the 'path' is now a child of a new 'g' element.
 */
export const groupPaths = {
	name: "groupPaths",
	fn: () => {
		return {
			element: {
				enter: (node, parentNode) => {
					if (node.name !== "path") return;
					parentNode.children = parentNode.children.map((childNode, index) => {
						if (childNode === node) {
							return {
								...node,
								name: "g",
								type: "element",
								children: [node],
								attributes: {},
							};
						}
						return childNode;
					});
				},
			},
		};
	},
};
