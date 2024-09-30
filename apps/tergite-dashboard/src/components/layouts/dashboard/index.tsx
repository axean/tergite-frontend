import { TooltipProvider } from "../../ui/tooltip";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { TopBanner } from "./components/top-banner";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import { logout, myProjectsQuery } from "@/lib/api-client";
import { AppState, Project } from "../../../../types";
import { useCallback, useContext, useState } from "react";
import { AppStateContext } from "@/lib/app-state";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { loadOrRedirectIf401 } from "@/lib/utils";

export function Dashboard() {
  const { projects } = useLoaderData() as DashboardData;
  const appState = useContext(AppStateContext);
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const contentAreaPaddingCls = isExpanded ? "sm:pl-48" : "sm:pl-20";
  const toggleIsExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [setIsExpanded, isExpanded]);

  const handleLogout = useCallback(() => {
    logout(queryClient, appState).then(() => navigate("/login"));
  }, [queryClient, appState, navigate]);

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-muted/40">
        <Sidebar
          isExpanded={isExpanded}
          onIsExpandedChange={toggleIsExpanded}
        />
        <div
          className={`flex flex-col sm:gap-4 h-full sm:pt-4 ${contentAreaPaddingCls}`}
        >
          <Topbar
            currentProject={appState.currentProjectExtId}
            onProjectChange={appState.setCurrentProjectExtId}
            projects={projects}
            onLogout={handleLogout}
          />

          <TopBanner />
          <Outlet />
        </div>
      </div>
    </TooltipProvider>
  );
}

interface DashboardData {
  projects: Project[];
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader(_appState: AppState, queryClient: QueryClient) {
  return loadOrRedirectIf401(async () => {
    const cachedProjects = queryClient.getQueryData(myProjectsQuery.queryKey);
    const projects =
      cachedProjects ?? (await queryClient.fetchQuery(myProjectsQuery));

    return { projects } as DashboardData;
  });
}
