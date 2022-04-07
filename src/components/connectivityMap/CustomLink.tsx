import { Group } from '@visx/group';
import React from 'react';

type CustomLinkProps = {
	link: Link;
	yMax: number;
	xMax: number;
	onSelect: (id: number) => void;
};

const CustomLink: React.FC<CustomLinkProps> = ({ link, yMax, xMax, onSelect }) => {
	return (
		<Group top={-yMax / 10} left={xMax / 10} style={{ cursor: 'pointer' }}>
			{' '}
			<line
				onMouseEnter={(e) => {
					e.currentTarget.setAttribute('stroke', '#38B2AC');
				}}
				onMouseLeave={(e) => {
					e.currentTarget.setAttribute('stroke', '#366361');
				}}
				onMouseDown={() => {
					onSelect(0);
				}}
				x1={`${link.source.x}`}
				y1={`${link.source.y}`}
				x2={`${link.target.x}`}
				y2={`${link.target.y}`}
				strokeWidth={16}
				stroke='#366361'
			></line>
			{/* <DefaultLink link={link}></DefaultLink> */}
		</Group>
	);
};

export default CustomLink;
