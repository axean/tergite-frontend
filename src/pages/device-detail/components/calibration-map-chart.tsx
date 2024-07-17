import {
  CalibrationDataPoint,
  Device,
  DeviceCalibration,
  QubitProp,
} from "@/lib/types";
import { useParentSize } from "@visx/responsive";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { useMemo } from "react";
import { Graph, DefaultNode } from "@visx/network";
import { localPoint } from "@visx/event";
import { scalePoint } from "@visx/scale";

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "hsl(var(--secondary-foreground))",
  color: "hsl(var(--secondary))",
  minWidth: "1.25rem",
};

let tooltipTimeout: number;

export function CalibrationMapChart({
  minWidth,
  data,
  device,
  currentProp,
}: Props) {
  const {
    parentRef,
    width: _width,
    height,
  } = useParentSize({ debounceTime: 50 });

  const width = Math.max(minWidth, _width);
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  const xValues = useMemo(
    () => [...new Set(device.coordinates.map((v) => v[0]))].sort(),
    [device]
  );
  const yValues = useMemo(
    () => [...new Set(device.coordinates.map((v) => v[1]))].sort(),
    [device]
  );

  const chatData: CalibrationDataPoint[] = useMemo(
    () =>
      data.qubits.map((v, index) => ({
        ...v[currentProp],
        index,
      })),
    [data.qubits, currentProp]
  );

  // scales
  const xScale = useMemo(
    () =>
      scalePoint<number>({
        domain: xValues,
        padding: 0.2,
        range: [margin.left, xMax],
      }),
    [xValues, xMax, margin.left]
  );
  const yScale = useMemo(
    () =>
      scalePoint<number>({
        domain: yValues,
        padding: 0.2,
        range: [yMax, margin.top],
      }),
    [yValues, yMax, margin.top]
  );

  const qubits: QubitNode[] = useMemo(
    () =>
      device.coordinates.map(([x, y], idx) => ({
        x: xScale(x) ?? 0,
        y: yScale(y) ?? 0,
        data: chatData[idx],
      })),
    [chatData, device, xScale, yScale]
  );

  const couplers: CouplerLink[] = useMemo(
    () =>
      device.couplingMap.map(([srcQubit, dstQubit]) => ({
        source: qubits[srcQubit],
        target: qubits[dstQubit],
      })),
    [device, qubits]
  );

  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<{ qubit: number; value: string }>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // TooltipInPortal is rendered in a separate child of <body /> and positioned
    // with page coordinates which should be updated on scroll. consider using
    // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
    scroll: true,
  });
  return (
    <div ref={parentRef} className="relative w-full h-full overflow-auto">
      <svg ref={containerRef} width={width} height={height}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={4}
          className="bg-transparent fill-transparent"
        />
        <Graph<CouplerLink, QubitNode>
          graph={{
            nodes: qubits,
            links: couplers,
          }}
          top={margin.top}
          left={margin.left}
          nodeComponent={({ node: { data } }) => (
            <DefaultNode
              className="fill-secondary-foreground stroke-[3] stroke-primary-foreground"
              data-qubit={data.index}
              data-value={`${data.value.toFixed(2)} ${data.unit}`}
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const tooltipData = event.target.dataset;

                tooltipData &&
                  showTooltip({
                    tooltipData,
                    tooltipTop: eventSvgCoords?.y,
                    tooltipLeft: eventSvgCoords?.x,
                  });
              }}
            />
          )}
          linkComponent={({ link: { source, target } }) => (
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              className="stroke-secondary-foreground stroke-[8]"
            />
          )}
        />
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <strong>Qubit {tooltipData.qubit}</strong>
          </div>
          <div>{tooltipData.value}</div>
        </TooltipInPortal>
      )}
    </div>
  );
}

interface Props {
  data: DeviceCalibration;
  device: Device;
  currentProp: QubitProp;
  minWidth: number;
  fieldLabels: { [k: string]: string };
}

interface QubitNode {
  x: number;
  y: number;
  data: CalibrationDataPoint;
}

interface CouplerLink {
  source: QubitNode;
  target: QubitNode;
}
