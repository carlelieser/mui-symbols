import parse from "parse-svg-path";
import translate from "translate-svg-path";
import serialize from "serialize-svg-path";

export const translatePaths = (from, to) => ({
	name: "translatePaths",
	description:
		"Shift all paths to new positions, determined by the provided coordinates, starting from the initial 'from' value.",
	fn: () => {
		let deltaX, deltaY;
		return {
			element: {
				enter: node => {
					if (node.name === "svg") {
						deltaX = to.x - from.x;
						deltaY = to.y - from.y;
					}
					if (node.name === "path") {
						const d = node.attributes.d;

						if (!d) return;

						if (deltaX || deltaY) {
							const path = parse(d);
							const translated = translate(path, deltaX, deltaY);
							node.attributes.d = serialize(translated);
						}
					}
				},
			},
		};
	},
});
