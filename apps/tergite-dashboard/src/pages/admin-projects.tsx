import { loadOrRedirectIfAuthErr } from "@/lib/utils";
import { QueryClient } from "@tanstack/react-query";
import { AppState } from "types";

export function AdminProjects() {
  return <div>Admin projects</div>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader(_appState: AppState, _queryClient: QueryClient) {
  return loadOrRedirectIfAuthErr(async () => {
    return {} as AdminProjectsData;
  });
}

interface AdminProjectsData {}
