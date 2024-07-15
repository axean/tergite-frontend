import { CalibrationValue, DeviceCalibration } from "@/lib/types";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { Grid } from "@visx/grid";
import { scaleBand, scaleLinear } from "@visx/scale";
import { localPoint } from "@visx/event";
import { useParentSize } from "@visx/responsive";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const qubitPropsMap: { [k: string]: string } = {
  t1_decoherence: "T1 decoherence",
  t2_decoherence: "T2 decoherence",
  frequency: "Frequency",
  anharmonicity: "Anharmonicity",
  readout_assignment_error: "Readout error",
};

interface DataPoint extends CalibrationValue {
  index: number;
}

const getYValue = (item: DataPoint) => item.value;
const getXValue = (item: DataPoint) => item.index;

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};

let tooltipTimeout: number;

// Inspired from See https://airbnb.io/visx/barstack
export function CalibrationDataBarChart({ data, minWidth }: Props) {
  const {
    parentRef,
    width: _width,
    height,
  } = useParentSize({ debounceTime: 50 });

  const width = Math.max(minWidth, _width);
  const margin = { top: 50, right: 0, bottom: 0, left: 50 };
  const xMax = Math.max(width - margin.left, 0);
  const yMax = Math.max(height - margin.top - 100, 0);

  const [currentProp, setCurrentProp] = useState<string>("t1_decoherence");
  const currentPropLabel = qubitPropsMap[currentProp];

  const chatData: DataPoint[] = useMemo(
    () =>
      data.qubits.map((v, index) => ({
        ...v[currentProp],
        index,
      })),
    [data.qubits, currentProp]
  );

  const maxYValue = useMemo(
    () => Math.max(...chatData.map(getYValue)),
    [chatData]
  );
  const yAxisLabel = chatData[0]?.unit
    ? `${currentPropLabel} (${chatData[0].unit})`
    : currentPropLabel;

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

  // scales
  const xScale = scaleBand<number>({
    domain: chatData.map(getXValue),
    padding: 0.2,
    range: [0, xMax],
    round: true,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxYValue],
    nice: true,
    range: [yMax, 0],
  });

  return (
    <div ref={parentRef} className="relative w-full h-full overflow-auto">
      <Select value={currentProp} onValueChange={setCurrentProp}>
        <SelectTrigger className="ml-auto w-fit focus:ring-0">
          <span className="hidden sm:inline text-muted-foreground pr-1">
            Property:{" "}
          </span>
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(qubitPropsMap).map((prop) => (
            <SelectItem value={prop} key={prop}>
              {qubitPropsMap[prop]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={xScale.bandwidth() / 2}
        />
        <Group top={margin.top} left={margin.left}>
          {chatData.map((record) => {
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
          })}
        </Group>
        <AxisBottom
          top={yMax + margin.top}
          left={margin.left}
          scale={xScale}
          tickLabelProps={{
            textAnchor: "middle",
            className: "text-sm",
          }}
          label="Qubit"
          labelClassName="text-sm"
          labelOffset={30}
        />
        <AxisLeft
          scale={yScale}
          top={margin.top}
          left={margin.left}
          label={yAxisLabel}
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
            <strong>Qubit {tooltipData.index}</strong>
          </div>
          <div>
            {tooltipData?.value?.toFixed(2)} {tooltipData.unit}
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}

interface Props {
  data: DeviceCalibration;
  minWidth: number;
}
