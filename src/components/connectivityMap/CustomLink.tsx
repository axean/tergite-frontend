import { Group } from '@visx/group';
import ToolTip from './ToolTip';
import React, { useContext, useRef } from 'react';
import { BackendContext, MapActions } from '../../state/BackendContext';
import { useTooltip } from '@visx/tooltip';
import { Text } from '@visx/text';
type CustomLinkProps = {
	link: Link;
	id: number;
	onSelect?: (id: number) => void;
	yMax: number;
	xMax: number;
	hideLabels: boolean;
	linkWidth?: number;
	data: Nullable<{
		allLinkData: API.ComponentData[];
		linkData: {
			id: number;
			data?: API.Property[];
		};
	}>;
};

const CustomLink: React.FC<CustomLinkProps> = ({
	link,
	yMax,
	xMax,
	onSelect,
	id,
	data,
	hideLabels,
	linkWidth
}) => {
	const [{ selectedLink, linkComponent }, dispatch] = useContext(BackendContext);

	const { tooltipOpen, tooltipTop, tooltipLeft, hideTooltip, showTooltip, tooltipData } =
		useTooltip();

	const linkRef = useRef(null);

	const formattedValue = data && data.linkData.data ? data.linkData.data[0].value.toFixed(3) : id;

	linkWidth = linkWidth === undefined ? 28 : linkWidth;

	return (
		<Group
			data-cy-qubitmap-link-type={linkComponent}
			data-cy-qubitmap-link-id={id}
			top={-yMax / 10}
			left={xMax / 10}
			style={{ cursor: 'pointer' }}
			onMouseEnter={() => {
				linkRef.current.setAttribute('stroke', '#38B2AC');
				const { top, left } = linkRef.current.getBoundingClientRect();

				showTooltip({
					tooltipData: selectedLink,
					tooltipTop: top + 20,
					tooltipLeft: left + 20
				});
			}}
			onMouseLeave={() => {
				if (id !== selectedLink) linkRef.current.setAttribute('stroke', '#366361');
				hideTooltip();
			}}
			onMouseDown={() => {
				dispatch({ type: MapActions.SELECT_LINK, payload: link.id });
				onSelect && onSelect(0);
			}}
		>
			{' '}
			<line
				ref={linkRef}
				x1={`${link.from.x}`}
				y1={`${link.from.y}`}
				x2={`${link.to.x}`}
				y2={`${link.to.y}`}
				strokeWidth={linkWidth}
				stroke={link.id === selectedLink ? '#38B2AC' : '#366361'}
			></line>
			{!hideLabels && (
				<Text
					x={(link.to.x + link.from.x) / 2}
					y={(link.to.y + link.from.y) / 2}
					fill='#f0f0f0'
					verticalAnchor='middle'
					textAnchor='middle'
					scaleToFit='shrink-only'
					width={linkWidth - 2}
				>
					{formattedValue}
				</Text>
			)}
			{tooltipOpen && tooltipData && data && (
				<ToolTip
					toolTipData={data.allLinkData.find((n) => n.id === id)}
					top={tooltipTop}
					left={tooltipLeft}
				/>
			)}
		</Group>
	);
};

export default CustomLink;
