import { TooltipProvider } from "../ui/tooltip";
import { Sidebar } from "../sections/sidebar";
import { Topbar, TopbarMenu } from "../sections/topbar";
import { TopBanner } from "../sections/top-banner";
import {
  LoaderFunctionArgs,
  Location as ReactRouterLocation,
  Outlet,
  useLoaderData,
  useLocation,
} from "react-router-dom";
import { projectList } from "@/lib/mock-data";
import { AppState, ProjectDetail } from "@/lib/types";
import { useContext } from "react";
import { AppStateContext } from "@/lib/app-state";

export function Dashboard() {
  const { projects } = useLoaderData() as DashboardData;
  const { currentProject, setCurrentProject } = useContext(AppStateContext);
  const location = useLocation();
  const pageTitle = location.pathname.slice(1) || "Dashboard";

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <TopbarMenu />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-48">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sidebar />
            <Topbar
              currentProject={currentProject}
              onProjectChange={setCurrentProject}
              projects={projects}
              pageTitle={pageTitle}
            />
          </header>

          <TopBanner />
          <Outlet />
        </div>
      </div>
    </TooltipProvider>
  );
}

interface DashboardData {
  projects: ProjectDetail[];
}

export function loader(appState: AppState) {
  return async ({}: LoaderFunctionArgs) => {
    return { projects: projectList } as DashboardData;
  };
}
