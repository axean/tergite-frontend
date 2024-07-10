import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deviceCalibrationData, deviceList } from "@/lib/mock-data";
import {
  AggregateValue,
  AppState,
  Device,
  DeviceCalibration,
} from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { DeviceStatusDiv } from "@/components/ui/device-status-div";
import { Switch } from "@/components/ui/switch";
import { PropsWithChildren, useMemo } from "react";
import { cn, getCalibrationMedians } from "@/lib/utils";
import { DateTime } from "luxon";

export function DeviceDetail() {
  const { device, calibrationData } = useLoaderData() as DeviceDetailData;
  return (
    <main className="grid auto-rows-fr flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
      <Card className="p-4 sm:px-6 lg:col-span-2 xl:col-span-3">
        <CardHeader className="pb-4">{device.name}</CardHeader>
        <CardContent>{device.name}</CardContent>
      </Card>
      <DeviceSummary
        device={device}
        calibrationData={calibrationData}
        className="order-first lg:order-none"
      />
    </main>
  );
}

export function loader(appState: AppState) {
  return async ({ params }: LoaderFunctionArgs) => {
    const device = deviceList.filter((v) => v.name === params.deviceName)[0];
    if (device === undefined) {
      throw new Error(`device data for ${params.deviceName} not found`);
    }

    const calibrationData = deviceCalibrationData.filter(
      (v) => v.name === params.deviceName
    )[0];
    if (device === undefined) {
      throw new Error(`calibration for ${params.deviceName} not found`);
    }

    return { device, calibrationData };
  };
}

interface DeviceDetailData {
  device: Device;
  calibrationData: DeviceCalibration;
}

function DeviceSummary({
  device,
  calibrationData,
  className = "",
}: DeviceSummaryProps) {
  const deviceMedians: DeviceCalibrationMedians = useMemo(
    () =>
      getCalibrationMedians(calibrationData.qubits, [
        "t1_decoherence",
        "t2_decoherence",
        "readout_assignment_error",
      ]),
    [calibrationData.qubits]
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start bg-muted/50 justify-between">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            {device.name}
          </CardTitle>
          <CardDescription>Version {device.version}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Details</div>
          <ul className="grid gap-3">
            <DetailItem label="Status">
              <DeviceStatusDiv device={device} />
            </DetailItem>

            <DetailItem label="Basis gates">
              {device.basisGates.join(", ")}
            </DetailItem>

            <DetailItem label="Simulator">
              <Switch disabled={true} defaultChecked={device.isSimulator} />
            </DetailItem>
          </ul>
          <Separator className="my-2" />
          <ul className="grid gap-3">
            <DetailItem label="Qubits">
              <span className="text-2xl">{device.numberOfQubits}</span>
            </DetailItem>
          </ul>
        </div>

        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="font-semibold">Calibration Information</div>
          <ul className="grid gap-3">
            <DetailItem label="Median readout error">
              {deviceMedians.readout_assignment_error?.value?.toFixed(2)}{" "}
              {deviceMedians.readout_assignment_error?.unit}
            </DetailItem>
            <DetailItem label="Median T1">
              {deviceMedians.t1_decoherence?.value?.toFixed(2)}{" "}
              {deviceMedians.t1_decoherence?.unit}
            </DetailItem>
            <DetailItem label="Median T2">
              {deviceMedians.t2_decoherence?.value?.toFixed(2)}{" "}
              {deviceMedians.t2_decoherence?.unit}
            </DetailItem>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Last calibrated{" "}
          <time dateTime={calibrationData.lastCalibrated}>
            {DateTime.fromISO(calibrationData.lastCalibrated).toRelative()}
          </time>
        </div>
      </CardFooter>
    </Card>
  );
}

interface DeviceSummaryProps {
  device: Device;
  calibrationData: DeviceCalibration;
  className?: string;
}

interface DeviceCalibrationMedians {
  t1_decoherence?: AggregateValue;
  t2_decoherence?: AggregateValue;
  readout_assignment_error?: AggregateValue;
}

function DetailItem({
  label,
  children,
  className = "",
}: PropsWithChildren<DetailItemProps>) {
  return (
    <li className={cn("flex items-center justify-between", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </li>
  );
}

interface DetailItemProps {
  label: string;
  className?: string;
}
