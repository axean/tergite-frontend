import { TooltipProvider } from "../../ui/tooltip";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { TopBanner } from "./components/top-banner";
import { LoaderFunctionArgs, Outlet, useLoaderData } from "react-router-dom";
import { projectList } from "@/lib/mock-data";
import { AppState, Project } from "@/lib/types";
import { useContext } from "react";
import { AppStateContext } from "@/lib/app-state";

export function Dashboard() {
  const { projects } = useLoaderData() as DashboardData;
  const { currentProject, setCurrentProject } = useContext(AppStateContext);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-48">
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
