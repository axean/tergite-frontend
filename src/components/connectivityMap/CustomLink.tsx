import { Group } from '@visx/group';
import React, { useContext } from 'react';
import { BackendContext, MapActions } from '../../state/BackendContext';

type CustomLinkProps = {
	link: Link;
	yMax: number;
	xMax: number;
	id: any;
	onSelect: (id: number) => void;
};

const CustomLink: React.FC<CustomLinkProps> = ({ link, yMax, xMax, onSelect, id }) => {
	const [{ selectedLink }, dispatch] = useContext(BackendContext);
	console.log('link', link);
	return (
		<Group top={-yMax / 10} left={xMax / 10} style={{ cursor: 'pointer' }}>
			{' '}
			<line
				onMouseEnter={(e) => {
					e.currentTarget.setAttribute('stroke', '#38B2AC');
				}}
				onMouseLeave={(e) => {
					if (link.id !== selectedLink) e.currentTarget.setAttribute('stroke', '#366361');
				}}
				onMouseDown={() => {
					dispatch({ type: MapActions.SELECT_LINK, payload: link.id });
					onSelect && onSelect(0);
				}}
				x1={`${link.from.x}`}
				y1={`${link.from.y}`}
				x2={`${link.to.x}`}
				y2={`${link.to.y}`}
				strokeWidth={16}
				stroke={link.id === selectedLink ? '#38B2AC' : '#366361'}
			></line>
			{/* <DefaultLink link={link}></DefaultLink> */}
		</Group>
	);
};

export default CustomLink;
