import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  currentUserQuery,
  myProjectsQpuTimeRequestsQuery,
  myProjectsQuery,
  refreshMyProjectsQueries,
} from "@/lib/api-client";
import { loadOrRedirectIfAuthErr } from "@/lib/utils";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  User,
  UserRequestStatus,
  type AppState,
  type Project,
} from "../../../types";
import { ProjectsTable } from "./components/project-table";
import { ProjectsSidebar } from "./components/project-sidebar";
import { Row, RowSelectionState } from "@tanstack/react-table";
import { useLoaderData } from "react-router-dom";

export function Projects() {
  const queryClient = useQueryClient();
  const { currentUser } = useLoaderData() as ProjectsPageData;
  const { data: projects = [] } = useQuery(myProjectsQuery);
  const { data: qpuTimeRequests = [] } = useQuery(
    myProjectsQpuTimeRequestsQuery({
      status: UserRequestStatus.PENDING,
      projects,
    })
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedProjectIdx = useMemo(() => {
    const selectedEntries = Object.entries(rowSelection).filter(
      ([_k, v]) => v === true
    );
    if (selectedEntries.length > 0) {
      return parseInt(selectedEntries[0][0]);
    }
    return -1;
  }, [rowSelection]);

  const handleRowClick = useCallback(
    (row: Row<Project>) => {
      if (!row.getIsSelected()) {
        row.toggleSelected();
        setRowSelection({ [row.id]: true });
      }
    },
    [setRowSelection]
  );

  const handleProjectDelete = useCallback(async () => {
    await refreshMyProjectsQueries(queryClient);
    // clear selected rows
    setRowSelection({});
  }, [queryClient, setRowSelection]);

  return (
    <main className="grid flex-1 items-start gap-4 grid-cols-1 p-4 sm:px-6 sm:py-0 md:gap-8 xl:grid-cols-4">
      <Card className="col-span-1 mt-14  xl:pt-3 xl:col-span-3">
        <CardHeader>
          <CardDescription>Projects</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsTable
            data={projects}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
            onRowClick={handleRowClick}
            currentUser={currentUser}
            qpuTimeRequests={qpuTimeRequests}
          />
        </CardContent>
      </Card>

      <ProjectsSidebar
        project={projects[selectedProjectIdx]}
        className="order-first xl:order-none mt-14 col-span-1"
        onDelete={handleProjectDelete}
        canDelete={projects[selectedProjectIdx]?.admin_id === currentUser.id}
      />
    </main>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader(_appState: AppState, queryClient: QueryClient) {
  return loadOrRedirectIfAuthErr(async (): Promise<ProjectsPageData> => {
    const cachedCurrentUser = queryClient.getQueryData(
      currentUserQuery.queryKey
    );
    const currentUser =
      cachedCurrentUser ?? (await queryClient.fetchQuery(currentUserQuery));
    return { currentUser };
  });
}

interface ProjectsPageData {
  currentUser: User;
}
