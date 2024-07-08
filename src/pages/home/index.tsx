// export default function Home() {
//   // FIXME: If not logged in, redirect to login page
//   return <div>Home</div>;
// }

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Link, LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import DonutChart from "@/components/ui/donut-chart";

import { deviceList, jobList } from "@/lib/mock-data";
import { Job, Device, AppState } from "@/lib/types";
import { JobsTable } from "./components/jobs-table";
import { DevicesTable } from "./components/devices-table";

export function Home() {
  const { devices, jobs } = useLoaderData() as HomeData;
  const devicesOnlineRatio = React.useMemo(
    () =>
      Math.round(
        (devices.filter((v) => v.isOnline).length / devices.length) * 100
      ),
    [devices]
  );

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-[250px_auto_auto]">
          <Card className="grid-fit-content">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Devices Online</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                percentFill={devicesOnlineRatio}
                thickness="5%"
              ></DonutChart>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>List of available devices</CardDescription>
                </div>
                <Link to="/devices" className="font-normal underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DevicesTable data={devices} />
              {/* <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 lg:w-2/6">Device</TableHead>
                    <TableHead className="hidden lg:table-cell lg:w-1/6">
                      Qubits
                    </TableHead>
                    <TableHead className="text-right lg:text-left w-1/2 lg:w-1/6">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell lg:text-right lg:w-2/6">
                      Last Seen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.name}>
                      <TableCell>
                        <div className="font-medium">{device.name}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {device.numberOfQubits}
                      </TableCell>
                      <TableCell>
                        <DeviceStatusDiv
                          className="ml-auto lg:ml-0"
                          device={device}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell lg:text-right">
                        {device.lastOnline
                          ? DateTime.fromISO(device.lastOnline).toRelative()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table> */}
            </CardContent>
          </Card>
        </div>
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2"></div>
        </div>
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Jobs</CardTitle>
            <CardDescription>The status of your jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <JobsTable data={jobs} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

interface HomeData {
  devices: Device[];
  jobs: Job[];
}

export function loader(appState: AppState) {
  return async ({}: LoaderFunctionArgs) => {
    return { devices: deviceList, jobs: jobList } as HomeData;
  };
}
