import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Device } from "@/lib/types";

export function CalibrationHeader({ device }: Props) {
  return (
    <CardHeader className="px-7">
      <CardTitle>{device.name}</CardTitle>
      <CardDescription>Calibration data</CardDescription>
    </CardHeader>
  );
}

interface Props {
  device: Device;
}
