import { Copy, RefreshCcw } from "lucide-react";
import { IconButton } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { useCallback, useContext } from "react";
import { AppStateContext } from "@/lib/app-state";
import { copyToClipboard } from "@/lib/utils";
import {
  createAppToken,
  refreshMyTokensQueries,
  apiBaseUrl,
} from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function TopBanner() {
  const { apiToken, setApiToken, currentProjectExtId } =
    useContext(AppStateContext);
  const queryClient = useQueryClient();

  const appTokenCreation = useMutation({
    mutationKey: [
      apiBaseUrl,
      "me",
      "tokens",
      "?project_ext_id=",
      currentProjectExtId,
      "post",
    ],
    async mutationFn({ projectExtId }: { projectExtId?: string }) {
      if (projectExtId) {
        return await createAppToken({
          title: `${projectExtId}-${new Date().getTime()}`,
          project_ext_id: projectExtId,
          lifespan_seconds: 7_200,
        });
      }
    },
    onSuccess(data) {
      if (data) {
        setApiToken(data.access_token);
        refreshMyTokensQueries(queryClient);
      }
    },
    throwOnError: true,
  });

  const handleApiTokenCopy = useCallback(
    () => copyToClipboard(apiToken || ""),
    [apiToken]
  );
  return (
    <header data-testid="top-banner" className="flex px-4 sm:px-6 py-4">
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
          className="rounded-none focus:mr-[1px] disabled:text-muted-foreground disabled:bg-muted"
          Icon={RefreshCcw}
          disabled={!currentProjectExtId || appTokenCreation.isPending}
          onClick={() =>
            appTokenCreation.mutate({ projectExtId: currentProjectExtId })
          }
        />
        <IconButton
          variant="outline"
          className="rounded-l-none disabled:text-muted-foreground disabled:bg-muted"
          disabled={!apiToken}
          onClick={handleApiTokenCopy}
          Icon={Copy}
        />
      </div>
    </header>
  );
}
