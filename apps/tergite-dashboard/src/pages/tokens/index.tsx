import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  myProjectsQuery,
  myTokensQuery,
  refreshMyTokensQueries,
} from "@/lib/api-client";
import { loadOrRedirectIf401 } from "@/lib/utils";
import {
  QueryClient,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { type AppState, type ExtendedAppToken, type Project } from "types";
import { TokensTable } from "./components/tokens-table";
import { TokenSummary } from "./components/token-summary";
import { Row } from "@tanstack/react-table";

export function Tokens() {
  const queryClient = useQueryClient();
  const { currentProject, tokensQuery } = useLoaderData() as TokensPageData;
  const [previousProject, setPreviousProject] = useState<Project>();
  const { data: tokens = [] } = useQuery<ExtendedAppToken[]>(tokensQuery);
  const [currentTokenIdx, setCurrentTokenIdx] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<Row<ExtendedAppToken>>();
  const projectName = useMemo(
    () => currentProject?.name ?? "all projects",
    [currentProject]
  );

  const handleTokenDelete = useCallback(async () => {
    refreshMyTokensQueries(queryClient);
    const index = selectedRow ? tokens.indexOf(selectedRow?.original) : 0;
    setCurrentTokenIdx(index);
  }, [setCurrentTokenIdx, tokens, queryClient, selectedRow]);

  const handleRowClick = useCallback(
    (row: Row<ExtendedAppToken>) => {
      if (!row.getIsSelected()) {
        row.toggleSelected();
        setCurrentTokenIdx(tokens.indexOf(row.original));
        setSelectedRow(row);
      }
    },
    [setSelectedRow, setCurrentTokenIdx, tokens]
  );

  useEffect(() => {
    // track the changes in current project and reset the current token when projects change
    if (previousProject?.id != currentProject?.id) {
      setCurrentTokenIdx(0);
      setPreviousProject(currentProject);

      try {
        selectedRow?.toggleSelected();
      } catch (error) {}

      setSelectedRow(undefined);
    }
  }, [
    currentProject,
    previousProject,
    tokens,
    selectedRow,
    setPreviousProject,
    setCurrentTokenIdx,
    setSelectedRow,
  ]);

  return (
    <main className="grid flex-1 items-start gap-4 grid-cols-1 p-4 sm:px-6 sm:py-0 md:gap-8 xl:grid-cols-4">
      <Card className="col-span-1 mt-14  xl:pt-3 xl:col-span-3">
        <CardHeader>
          <CardDescription>API tokens for {projectName}</CardDescription>
        </CardHeader>
        <CardContent>
          <TokensTable data={tokens} onRowClick={handleRowClick} />
        </CardContent>
      </Card>

      {tokens[currentTokenIdx] && (
        <TokenSummary
          token={tokens[currentTokenIdx]}
          className="order-first xl:order-none mt-14 col-span-1"
          onDelete={handleTokenDelete}
        />
      )}
    </main>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader(appState: AppState, queryClient: QueryClient) {
  return loadOrRedirectIf401(async () => {
    // project object
    const cachedProjects: Project[] | undefined = queryClient.getQueryData(
      myProjectsQuery.queryKey
    );
    const projectList =
      cachedProjects ?? (await queryClient.fetchQuery(myProjectsQuery));

    const currentProject = projectList.filter(
      (v) => v.ext_id === appState.currentProjectExtId
    )[0];

    // tokens
    const tokensQuery = myTokensQuery({
      project_ext_id: currentProject?.ext_id,
      projectList,
    });

    return {
      currentProject,
      tokensQuery,
    } as TokensPageData;
  });
}

interface TokensPageData {
  currentProject?: Project;
  tokensQuery: UseQueryOptions<ExtendedAppToken[]>;
}
