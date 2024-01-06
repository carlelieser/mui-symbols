import React, { useEffect, useMemo, useState } from "react";
import { SvgIcon } from "@mui/material";

const createSvgIcon = (path, displayName) => {
	const Component = (props, ref) => {
		const id = useMemo(() => Date.now(), []);
		const [size, setSize] = useState([24, 24]);
		const viewBox = useMemo(() => {
			return `0 -${size[1]} ${size[0]} ${size[1]}`;
		}, [size]);

		useEffect(() => {
			const resizeObserver = new ResizeObserver(entries => {
				for (let entry of entries) {
					if (entry.target.className.includes(`material-symbol-${id}`)) {
						const style = window.getComputedStyle(entry.target);
						const size = [style.width, style.height].map(number => Number(number));
						setSize(size);
					}
				}
			});

			if (ref.current) {
				resizeObserver.observe(ref.current);
			}

			return () => {
				if (ref) {
					resizeObserver.unobserve(ref.current);
				}
			};
		}, [id]);

		return React.createElement(SvgIcon, {
			"data-testid": `${displayName}Icon`,
			ref,
			...props,
			children: path,
			className: `${props.className} material-symbol-${id}`,
			viewBox,
		});
	};

	if (process.env.NODE_EVN !== "production") {
		Component.displayName = `${displayName}Icon`;
	}
	Component.muiName = SvgIcon.muiName;

	return React.memo(React.forwardRef(Component));
};

export default createSvgIcon;