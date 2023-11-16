import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion"

const count = 10;
const sides = 7;
const radius = 400;
const points = new Array(count * sides).fill(true).map((_, i) => {
	const angle = 2 * Math.PI / (count * sides) * i;
	const r = radius + (((i % count) - count / 2) ** 2) * -3;
	// const r = radius + ((i % 10 === 0) ? 0 : (random(`radius-${i}`) * 100));
	const flatDelay = random(`xdelay-${i}`);
	const delay = i === count * sides - 2 ? 1 : flatDelay ** 1.2;
	return {
		x: r * Math.sin(angle),
		y: -r * Math.cos(angle),
		delay,
		angle,
		isSpecial: i % count === 0,
	}
});

const realDelay = (angle: number, delay: number, rotations: number) => {
	// Real delay will be (k + angle / (2 * Math.PI)) * 1/rotations
	// for the smallest integer k that makes it larger that delay.
	const k = Math.ceil(delay * (rotations - 1) - angle / (2 * Math.PI));
	return (k + angle / (2 * Math.PI)) / rotations;
}

export const Test = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames, width, height} = useVideoConfig();

	const secondsPerRotation = 3;
	const rotation = 360 * frame / fps / secondsPerRotation;
	const rotations = durationInFrames / fps / secondsPerRotation;

	const getDelay = (i: number) => realDelay(points[i].angle, points[i].delay, rotations) * durationInFrames;

	return (
		<AbsoluteFill style={{backgroundColor: "#111"}}>
			<AbsoluteFill style={{transform: "scale(0.95)"}}>
				<AbsoluteFill style={{
					width: `${height}px`,
					height: `${height}px`,
					left: `${(width - height) / 2}px`,
					borderRadius: "50%",
					boxShadow: `0px 0px 15px 5px #AAA`,
					background: "black",
				}}/>
				{points.map((_, i) => (
					<>
						{i > 0 && <Line delay={Math.max(getDelay(i), getDelay(i-1))} from={points[i-1]} to={points[i]}/>}
						{i === 0 && <Line delay={Math.max(getDelay(0), getDelay(points.length - 1))} from={points.at(-1)} to={points[0]}/>}
					</>
				))}
				{points.map(({x, y, isSpecial}, i) => (
					<>
						<Point x={width / 2 + x} y={height / 2 + y} delay={getDelay(i)} isSpecial={isSpecial}/>
					</>
				))}
				<RadarCone rotation={rotation}/>
			</AbsoluteFill>
			<InitialFlash/>
		</AbsoluteFill>
	)
}

const InitialFlash = () => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const opacity = interpolate(frame / fps, [0, 1], [1, 0], {
		easing: Easing.out(Easing.cubic),
	})
	return (
		<AbsoluteFill style={{backgroundColor: "#AAA", opacity}}/>
	)
}

const RadarCone = ({rotation}: {rotation: number}) => {
	const {fps, durationInFrames, width, height} = useVideoConfig();
	return (
		<>
			<AbsoluteFill style={{
				background: "conic-gradient(transparent, transparent 1deg, transparent 355deg, #AAA)",
				transform: `rotate(${rotation}deg)`,
			}}>
			<AbsoluteFill style={{
				width: 1,
				height: height / 2,
				background: "#AAA",
				left: width / 2,
				top: 0,
			}}/>
				</AbsoluteFill>
		</>
	);
}

type PointData = {
	x: number,
	y: number,
	delay: number,
	isSpecial: boolean,
}

const Point = ({x, y, delay, isSpecial}: PointData) => {
	const frame = useCurrentFrame();
	if (frame < delay) {
		return null;
	}
	const color = isSpecial ? "#F00" : "#FFF";
	const size = isSpecial ? 6 : 3;
	const scale = interpolate(frame - delay, [0, 40], [7, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.poly(3)),
	})
	return (
		<AbsoluteFill style={{
			width: size,
			height: size,
			borderRadius: size / 2,
			boxShadow: `0px 0px 15px ${scale}px ${color}`,
			background: color,
			// background: `radial-gradient(${color}, ${color}A, ${color}6, ${color}3, ${color}1, ${color}0, ${color}0, ${color}0, ${color}0, ${color}0)`,
			top: y,
			left: x,
			transform: `translate(-${size / 2}px, -${size / 2}px)`,
		}}/>
	);
}

const Line = ({delay, from, to}: {delay: number, from: PointData, to: PointData}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	if (frame < delay) {
		return null;
	}
	const deltaX = to.x - from.x;
	const deltaY = to.y - from.y;
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	const angle = Math.atan2(deltaY, deltaX);
	return (
		<AbsoluteFill style={{
			width: distance,
			height: 1,
			background: "#555",
			left: `${width / 2 + (from.x + to.x) / 2}px`,
			top: `${height / 2 + (from.y + to.y) / 2}px`,
			transform: `translate(-50%, -50%) rotate(${angle}rad)`,
			// transform: `translate(${width / 2 + from.x}px, ${height / 2 + from.y}px)`,
		}}/>
	)
}
