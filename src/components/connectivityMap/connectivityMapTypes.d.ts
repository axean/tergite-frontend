interface Point {
	id: number;
	x: number;
	y: number;
}
interface Link {
	source: Point;
	target: Point;
}
interface LinkAligned extends Link {
	vertical: boolean;
}

interface Data {
	nodes: Point[];
	links: LinkAligned[];
}
