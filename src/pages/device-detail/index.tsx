import { Card, CardContent } from "@/components/ui/card";
import { deviceCalibrationData, deviceList } from "@/lib/mock-data";
import { AppState, Device, DeviceCalibration } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { DeviceSummary } from "./components/device-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalibrationDataTable } from "./components/calibration-data-table";
import { CalibrationBarChart } from "./components/calibration-bar-chart";
import { CalibrationHeader } from "./components/calibration-header";

export function DeviceDetail() {
  const { device, calibrationData } = useLoaderData() as DeviceDetailData;

  return (
    <main className="grid flex-1 items-start gap-4 grid-cols-1 p-4 sm:px-6 sm:py-0 md:gap-8 xl:grid-cols-4">
      <Tabs defaultValue="map" className="col-span-1 xl:pt-3 xl:col-span-3">
        <TabsList className="flex items-center justify-start flex-wrap h-auto space-y-1">
          <TabsTrigger value="map">Map view</TabsTrigger>
          <TabsTrigger value="graph">Graph view</TabsTrigger>
          <TabsTrigger value="table">Table view</TabsTrigger>
        </TabsList>
        <TabsContent value="map">
          <Card>
            <CalibrationHeader device={device} />
            <CardContent>map</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graph">
          <Card className=" overflow-auto">
            <CalibrationHeader device={device} />
            <CardContent className="w-full min-w-[250px] h-[700px] lg:h-[750px] xl:h-[900px] overflow-auto">
              <CalibrationBarChart data={calibrationData} minWidth={250} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CalibrationHeader device={device} />
            <CardContent>
              <CalibrationDataTable data={calibrationData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DeviceSummary
        device={device}
        calibrationData={calibrationData}
        className="order-first xl:order-none mt-14 col-span-1"
      />
    </main>
  );
}

interface DeviceDetailData {
  device: Device;
  calibrationData: DeviceCalibration;
}

export function loader(_appState: AppState) {
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
