import { Copy, RefreshCcw } from "lucide-react";
import { IconButton } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { useCallback, useContext } from "react";
import { AppStateContext } from "@/lib/app-state";
import { copyToClipboard } from "@/lib/utils";

export function TopBanner({}: Props) {
  const { apiToken, setApiToken } = useContext(AppStateContext);
  const handleApiTokenRefresh = useCallback(() => {
    // FIXME: call an action to refresh token
    const newApiToken = `some-token-${new Date().getTime()}`;
    setApiToken(newApiToken);
  }, [setApiToken]);

  const handleApiTokenCopy = useCallback(
    () => copyToClipboard(apiToken || ""),
    [apiToken]
  );
  return (
    <header className="flex px-4 sm:px-6 py-4">
      <div className="relative w-full md:w-fit md:ml-auto flex items-center">
        <Label htmlFor="api-token" className="text-sm pr-2">
          API token
        </Label>
        <Input
          type="password"
          id="api-token"
          value={apiToken || ""}
          readOnly={true}
          className="w-full rounded-l-md rounded-r-none bg-background pr-8  md:w-[320px]"
        />
        <IconButton
          variant="outline"
          className="rounded-none focus:mr-[1px]"
          Icon={RefreshCcw}
          onClick={handleApiTokenRefresh}
        />
        <IconButton
          variant="outline"
          className="rounded-l-none"
          onClick={handleApiTokenCopy}
          Icon={Copy}
        />
      </div>
    </header>
  );
}
interface Props {}
