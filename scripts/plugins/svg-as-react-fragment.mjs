export const svgAsReactFragment = ({ onChildrenAsArray = () => {} }) => ({
	name: "svgAsReactFragment",
	fn: () => {
		return {
			root: {
				enter(root) {
					const [svg, ...rootChildren] = root.children;

					if (rootChildren.length > 0) {
						throw new Error("Expected a single child of the root");
					}

					if (svg.type !== "element" || svg.name !== "svg") {
						throw new Error("Expected an svg element as the root child");
					}

					if (svg.children.length > 1) {
						onChildrenAsArray();
						svg.children.forEach((svgChild, index) => {
							svgChild.attributes.key = index;
							svgChild.name = `SVGChild:${svgChild.name}`;
						});
					}

					root.children = svg.children;
				},
			},
		};
	},
});
