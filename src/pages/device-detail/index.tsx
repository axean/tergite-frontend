import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deviceCalibrationData, deviceList } from "@/lib/mock-data";
import { AppState, Device, DeviceCalibration } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { DeviceSummary } from "./components/device-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalibrationDataTable } from "./components/calibration-data-table";

export function DeviceDetail() {
  const { device, calibrationData } = useLoaderData() as DeviceDetailData;
  return (
    <main className="grid auto-rows-fr flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
      <Tabs defaultValue="map" className="lg:pt-3 lg:col-span-2 xl:col-span-3">
        <TabsList className="">
          <TabsTrigger value="map">Map view</TabsTrigger>
          <TabsTrigger value="graph">Graph view</TabsTrigger>
          <TabsTrigger value="table">Table view</TabsTrigger>
        </TabsList>
        <TabsContent value="map">
          <Card>
            <CalibrationDataHeader device={device} />
            <CardContent>map</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graph">
          <Card>
            <CalibrationDataHeader device={device} />
            <CardContent>graph</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CalibrationDataHeader device={device} />
            <CardContent>
              <CalibrationDataTable data={calibrationData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DeviceSummary
        device={device}
        calibrationData={calibrationData}
        className="order-first lg:order-none mt-14"
      />
    </main>
  );
}

interface DeviceDetailData {
  device: Device;
  calibrationData: DeviceCalibration;
}

function CalibrationDataHeader({ device }: CalibrationDataHeaderProps) {
  return (
    <CardHeader className="px-7">
      <CardTitle>{device.name}</CardTitle>
      <CardDescription>Calibration data</CardDescription>
    </CardHeader>
  );
}

interface CalibrationDataHeaderProps {
  device: Device;
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
