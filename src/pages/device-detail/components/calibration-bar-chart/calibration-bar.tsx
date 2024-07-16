import { CalibrationValue } from "@/lib/types";
import { Bar } from "@visx/shape";
import { localPoint } from "@visx/event";
import { ScaleBand, ScaleLinear } from "@visx/vendor/d3-scale";

let tooltipTimeout: number;

export function CalibrationBar({
  record,
  xScale,
  yScale,
  yMax,
  hideTooltip,
  showTooltip,
}: Props) {
  const x = getXValue(record);
  const y = getYValue(record);

  const barWidth = xScale.bandwidth();
  const barHeight = yMax - (yScale(y) ?? 0);
  const barX = xScale(x) ?? 0;
  const barY = yMax - barHeight;

  return (
    <Bar
      key={`bar-${x}`}
      x={barX}
      y={barY}
      width={barWidth}
      height={barHeight}
      className="fill-secondary-foreground"
      onMouseLeave={() => {
        tooltipTimeout = window.setTimeout(() => {
          hideTooltip();
        }, 300);
      }}
      onMouseMove={(event) => {
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        // TooltipInPortal expects coordinates to be relative to containerRef
        // localPoint returns coordinates relative to the nearest SVG, which
        // is what containerRef is set to in this example.
        const eventSvgCoords = localPoint(event);
        const left = barX + barWidth / 2;
        showTooltip({
          tooltipData: record,
          tooltipTop: eventSvgCoords?.y,
          tooltipLeft: left,
        });
      }}
    />
  );
}

export interface DataPoint extends CalibrationValue {
  index: number;
}

interface Props {
  record: DataPoint;
  xScale: ScaleBand<number>;
  yScale: ScaleLinear<number, number, never>;
  yMax: number;
  hideTooltip: () => void;
  showTooltip: (args: {
    tooltipLeft?: number;
    tooltipTop?: number;
    tooltipData?: DataPoint;
  }) => void;
}

export function getYValue(item: DataPoint) {
  return item.value;
}

export function getXValue(item: DataPoint) {
  return item.index;
}
