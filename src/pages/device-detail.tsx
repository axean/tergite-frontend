import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { deviceList } from "@/lib/mock-data";
import { AppState, Device } from "@/lib/types";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

export function DeviceDetail() {
  const { device } = useLoaderData() as DeviceDetailData;
  return (
    <Card className="p-4 sm:px-6 h-full">
      <CardHeader className="pb-4">{device.name}</CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <h3 className="font-semibold">Details</h3>
            </AccordionTrigger>
            <AccordionContent>{device.name}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
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
