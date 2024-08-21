import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Link, useLoaderData } from "react-router-dom";
import DonutChart from "@/components/ui/donut-chart";

import { devicesQuery, myJobsQuery, myProjectsQuery } from "@/lib/api-client";
import { Job, Device, AppState, Project } from "../../../types";
import { JobsTable } from "./components/jobs-table";
import { DevicesTable } from "./components/devices-table";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { loadOrRedirectIf401 } from "@/lib/utils";

export function Home() {
  const { currentProjectObj } = useLoaderData() as HomeData;
  const { data: devices = [] } = useQuery(devicesQuery);
  const { data: jobs = [] } = useQuery(
    myJobsQuery({ project_id: currentProjectObj?.id })
  );
  const devicesOnlineRatio = React.useMemo(
    () =>
      Math.round(
        (devices.filter((v) => v.is_online).length / devices.length) * 100
      ),
    [devices]
  );

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-[250px_auto_auto]">
          <Card className="grid-fit-content">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Devices Online</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                percentFill={devicesOnlineRatio}
                thickness="5%"
              ></DonutChart>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>List of available devices</CardDescription>
                </div>
                <Link to="/devices" className="font-normal underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DevicesTable data={devices.slice(0, 3)} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Jobs</CardTitle>
            <CardDescription>
              The status of your jobs in{" "}
              {currentProjectObj?.name || "all projects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsTable data={jobs} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

interface HomeData {
  devices: Device[];
  jobs: Job[];
  currentProjectObj?: Project;
}

// eslint-disable-next-line react-refresh/only-export-components
export function loader(appState: AppState, queryClient: QueryClient) {
  return loadOrRedirectIf401(async () => {
    // devices
    const cachedDevices = queryClient.getQueryData(devicesQuery.queryKey);
    const devices =
      cachedDevices ?? (await queryClient.fetchQuery(devicesQuery));

    // project object
    const cachedProjects: Project[] | undefined = queryClient.getQueryData(
      myProjectsQuery.queryKey
    );
    const projects =
      cachedProjects ?? (await queryClient.fetchQuery(myProjectsQuery));

    const currentProjectObj = projects.filter(
      (v) => v.ext_id === appState.currentProject
    )[0];

    // jobs
    const jobsQuery = myJobsQuery({ project_id: currentProjectObj?.id });
    const cachedJobs = queryClient.getQueryData(jobsQuery.queryKey);
    const jobs = cachedJobs ?? (await queryClient.fetchQuery(jobsQuery));

    return { devices, jobs, currentProjectObj } as HomeData;
  });
}
