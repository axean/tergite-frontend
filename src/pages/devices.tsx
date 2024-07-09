import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { DetailItem } from "@/components/ui/detail-item";
import { DeviceStatusDiv } from "@/components/ui/device-status-div";
import { deviceList } from "@/lib/mock-data";
import { AppState, Device } from "@/lib/types";
import { DateTime } from "luxon";
import { Link, LoaderFunctionArgs, useLoaderData } from "react-router-dom";

export function Devices() {
  const { devices } = useLoaderData() as DeviceData;

  return (
    <main className="grid flex-1 auto-rows-fr gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {devices.map((device) => (
        <Link to={`/devices/${device.name}`}>
          <Card className="text-sm h-full flex flex-col justify-between">
            <CardHeader className="pb-4">
              <div className="flex justify-between">
                <div className="font-semibold">{device.name}</div>{" "}
                <DeviceStatusDiv device={device} />
              </div>
            </CardHeader>
            <CardContent>
              <DetailItem label="Last seen">
                {device.lastOnline
                  ? DateTime.fromISO(device.lastOnline).toRelative()
                  : "N/A"}
              </DetailItem>
            </CardContent>
            <CardFooter className="flex">
              <div>
                <p className="text-muted-foreground">Qubits</p>
                <p className="text-4xl">{device.numberOfQubits}</p>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </main>
  );
}

interface DeviceData {
  devices: Device[];
}

export function loader(appState: AppState) {
  return async ({}: LoaderFunctionArgs) => {
    return { devices: deviceList } as DeviceData;
  };
}
