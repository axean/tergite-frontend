import { DeviceCalibration } from "@/lib/types";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { timeParse, timeFormat } from "@visx/vendor/d3-time-format";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import cityTemperature from "@visx/mock-data/lib/mocks/cityTemperature";
import { Grid } from "@visx/grid";
import { scaleBand, scaleLinear } from "@visx/scale";
import { localPoint } from "@visx/event";
import { useParentSize } from "@visx/responsive";

type CityName = "New York" | "San Francisco" | "Austin";

type DataPoint = { date: string; value: number };

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};

let tooltipTimeout: number;

// Inspired from See https://airbnb.io/visx/barstack
export function CalibrationDataBarChart({ data: d }: Props) {
  const { parentRef, width, height } = useParentSize({ debounceTime: 50 });
  const margin = { top: 50, right: 0, bottom: 0, left: 50 };
  const xMax = Math.max(width - margin.left, 0);
  const yMax = Math.max(height - margin.top - 100, 0);

  const data = cityTemperature
    .filter((v) => v.Austin)
    .map((v) => ({ date: v.date, value: Number(v.Austin) }))
    .slice(0, 12);
  const temperatureTotals = data.map((v) => v.value);

  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<DataPoint>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // TooltipInPortal is rendered in a separate child of <body /> and positioned
    // with page coordinates which should be updated on scroll. consider using
    // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
    scroll: true,
  });

  // accessors
  const getDate = (d: { date: string; value: number }) => d.date;

  const parseDate = timeParse("%Y-%m-%d");
  const format = timeFormat("%b %d");
  const formatDate = (date: string) => format(parseDate(date) as Date);

  // scales
  const dateScale = scaleBand<string>({
    domain: data.map(getDate),
    padding: 0.2,
  });
  const temperatureScale = scaleLinear<number>({
    domain: [0, Math.max(...temperatureTotals)],
    nice: true,
  });

  dateScale.rangeRound([0, xMax]);
  temperatureScale.range([yMax, 0]);

  return (
    <div ref={parentRef} className="relative w-full h-full">
      <svg ref={containerRef} width={width} height={height}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={4}
          className="bg-transparent fill-transparent"
        />
        <Grid
          top={margin.top}
          left={margin.left}
          xScale={dateScale}
          yScale={temperatureScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={dateScale.bandwidth() / 2}
        />
        <Group top={margin.top} left={margin.left}>
          {data.map((record) => {
            const key = record.date;
            const value = record.value;

            const barWidth = dateScale.bandwidth() + 2;
            const barHeight = yMax - (temperatureScale(value) ?? 0);
            const barX = dateScale(key) ?? 0;
            const barY = yMax - barHeight;

            return (
              <Bar
                key={`bar-${key}`}
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
          })}
        </Group>
        <AxisBottom
          top={yMax + margin.top}
          left={margin.left}
          scale={dateScale}
          tickFormat={formatDate}
          tickLabelProps={{
            textAnchor: "middle",
            className: "text-sm",
          }}
          label="Date"
          labelClassName="text-sm"
          labelOffset={30}
        />
        <AxisLeft
          scale={temperatureScale}
          top={margin.top}
          left={margin.left}
          label="Temperature (°F)"
          labelOffset={30}
          labelClassName="text-sm"
          tickLabelProps={{
            className: "text-sm",
          }}
        />
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <strong>{tooltipData.date}</strong>
          </div>
          <div>{tooltipData.value}℉</div>
          <div>
            <small>{formatDate(getDate(tooltipData))}</small>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}

interface Props {
  data: DeviceCalibration;
}
