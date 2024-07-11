import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { deviceCalibrationData, deviceList } from "@/lib/mock-data";
import { AppState, Device, DeviceCalibration } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { DeviceSummary } from "./components/device-summary";

export function DeviceDetail() {
  const { device, calibrationData } = useLoaderData() as DeviceDetailData;
  return (
    <main className="grid auto-rows-fr flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
      <Card className="p-4 sm:px-6 lg:col-span-2 xl:col-span-3">
        <CardHeader className="pb-4">{device.name}</CardHeader>
        <CardContent>{device.name}</CardContent>
      </Card>
      {/* FIXME: We probably need to add a way to reduce the size of the sidebar */}
      <DeviceSummary
        device={device}
        calibrationData={calibrationData}
        className="order-first lg:order-none"
      />
    </main>
  );
}

interface DeviceDetailData {
  device: Device;
  calibrationData: DeviceCalibration;
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
