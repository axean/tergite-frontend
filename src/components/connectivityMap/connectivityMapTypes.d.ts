interface Point {
	id: number;
	x: number;
	y: number;
}
interface Link {
	id: number;
	from: Point;
	to: Point;
}
interface LinkAligned extends Link {
	vertical: boolean;
}

interface Data {
	nodes: Point[];
	links: LinkAligned[];
}
