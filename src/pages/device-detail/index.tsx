import { Card, CardContent } from "@/components/ui/card";
import {
  singleDeviceCalibrationQuery,
  singleDeviceQuery,
} from "@/lib/api-client";
import { AppState, Device, DeviceCalibration, QubitProp } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { DeviceSummary } from "./components/device-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalibrationDataTable } from "./components/calibration-data-table";
import { CalibrationBarChart } from "./components/calibration-bar-chart";
import { CalibrationHeader } from "./components/calibration-header";
import { CalibrationMapChart } from "./components/calibration-map-chart";
import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { loadOrRedirectIf401 } from "@/lib/utils";

const fieldLabels: { [k: string]: string } = {
  t1_decoherence: "T1 decoherence",
  t2_decoherence: "T2 decoherence",
  frequency: "Frequency",
  anharmonicity: "Anharmonicity",
  readout_assignment_error: "Readout error",
};

export function DeviceDetail() {
  const { device, calibrationData } = useLoaderData() as DeviceDetailData;
  const [currentData, setCurrentData] = useState<QubitProp>("t1_decoherence");

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
            <CalibrationHeader
              device={device}
              currentData={currentData}
              fieldLabels={fieldLabels}
              onCurrentDataChange={setCurrentData}
            />
            <CardContent className="w-full min-w-[250px] h-[700px] lg:h-[750px] xl:h-[900px] overflow-auto">
              <CalibrationMapChart
                data={calibrationData}
                minWidth={250}
                fieldLabels={fieldLabels}
                device={device}
                currentProp={currentData}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graph">
          <Card className=" overflow-auto">
            <CalibrationHeader
              device={device}
              currentData={currentData}
              fieldLabels={fieldLabels}
              onCurrentDataChange={setCurrentData}
            />
            <CardContent className="w-full min-w-[250px] h-[700px] lg:h-[750px] xl:h-[900px] overflow-auto">
              <CalibrationBarChart
                data={calibrationData}
                minWidth={250}
                fieldLabels={fieldLabels}
                currentProp={currentData}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CalibrationHeader device={device} currentData="Calibration" />
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

// eslint-disable-next-line react-refresh/only-export-components
export function loader(_appState: AppState, queryClient: QueryClient) {
  return loadOrRedirectIf401(async ({ params }: LoaderFunctionArgs) => {
    const { deviceName = "" } = params;

    // device
    const deviceQuery = singleDeviceQuery(deviceName);
    const cachedDevice = queryClient.getQueryData(deviceQuery.queryKey);
    const device = cachedDevice ?? (await queryClient.fetchQuery(deviceQuery));

    // calibration
    const calibrationQuery = singleDeviceCalibrationQuery(deviceName);
    const cachedCalibrationData = queryClient.getQueryData(
      calibrationQuery.queryKey
    );
    const calibrationData =
      cachedCalibrationData ?? (await queryClient.fetchQuery(calibrationQuery));

    return { device, calibrationData };
  });
}
