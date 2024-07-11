import { TooltipProvider } from "../../ui/tooltip";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { TopBanner } from "./components/top-banner";
import { LoaderFunctionArgs, Outlet, useLoaderData } from "react-router-dom";
import { projectList } from "@/lib/mock-data";
import { AppState, Project } from "@/lib/types";
import { useCallback, useContext, useState } from "react";
import { AppStateContext } from "@/lib/app-state";

export function Dashboard() {
  const { projects } = useLoaderData() as DashboardData;
  const { currentProject, setCurrentProject } = useContext(AppStateContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const contentAreaPaddingCls = isExpanded ? "sm:pl-48" : "sm:pl-20";
  const toggleIsExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [setIsExpanded, isExpanded]);

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
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            projects={projects}
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

export function loader(appState: AppState) {
  return async ({}: LoaderFunctionArgs) => {
    return { projects: projectList } as DashboardData;
  };
}
