import { deviceList } from "@/lib/mock-data";
import { AppState, Device } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

export function DeviceDetail() {
  const { device } = useLoaderData() as DeviceDetailData;
  return <div>Device {device.name}</div>;
}

export function loader(appState: AppState) {
  return async ({ params }: LoaderFunctionArgs) => {
    const device = deviceList.filter((v) => v.name === params.deviceName)[0];
    if (device === undefined) {
      throw new Error(`${params.deviceName} not found`);
    }

    return { device };
  };
}

interface DeviceDetailData {
  device: Device;
}
