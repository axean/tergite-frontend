import { Copy, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function TopBanner({}: Props) {
  return (
    <header className="flex px-4 sm:px-6 py-4">
      <div className="relative w-full md:w-fit md:ml-auto flex items-center">
        <Label htmlFor="api-token" className="text-sm pr-2">
          API token
        </Label>
        <Input
          type="password"
          id="api-token"
          value={"some-value"}
          readOnly={true}
          className="w-full rounded-l-md rounded-r-none bg-background pr-8  md:w-[320px]"
        />
        <Button variant="outline" className="rounded-none" size="icon">
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="rounded-l-none" size="icon">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
interface Props {}
