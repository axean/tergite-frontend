import { Grid, GridItem, Box } from '@chakra-ui/react';
import { useTooltipInPortal } from '@visx/tooltip';

type ToolTipProps = {
	toolTipData: API.ComponentData;
	top: number;
	left: number;
};
const ToolTip: React.FC<ToolTipProps> = ({ toolTipData, top, left }) => {
	const keys = Object.keys(toolTipData);
	const { TooltipInPortal } = useTooltipInPortal();

	return (
		<TooltipInPortal key={Math.random()} top={top} left={left} data-cy-tooltip>
			<Box>
				<Grid templateRows='repeat(5, 1fr)' gap={0}>
					{keys.map((key, index) => {
						if (key === 'id')
							return (
								<GridItem w='100%' h='5' color='#2B8A79' key={index}>
									<strong>{key}</strong>: {toolTipData[key] as number}
								</GridItem>
							);
						return (
							<GridItem w='100%' h='5' color='#2B8A79' key={index}>
								<strong>{key}</strong>:{' '}
								{(toolTipData[key] as API.Property[])[0].value.toFixed(3)}
								{(toolTipData[key] as API.Property[])[0].unit}
							</GridItem>
						);
					})}
				</Grid>
			</Box>
		</TooltipInPortal>
	);
};

export default ToolTip;
