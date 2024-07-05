// export default function Home() {
//   // FIXME: If not logged in, redirect to login page
//   return <div>Home</div>;
// }

import * as React from "react";
import {
  Circle,
  CircleX,
  CircleCheck,
  ArrowDown,
  ArrowUp,
  CircleDashed,
} from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Link, LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import DonutChart from "@/components/ui/donut-chart";
import { DateTime, Duration } from "luxon";
import {
  DataTable,
  DataTableFilterField,
  DataTableFormConfig,
} from "@/components/ui/data-table";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { deviceList, jobList } from "@/lib/mock-data";
import { JobDetail, JobStatus, DeviceDetail, AppState } from "@/lib/types";

const jobTableColumns: ColumnDef<JobDetail>[] = [
  {
    accessorKey: "jobId",
    header: "Job ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("jobId")}</div>
    ),
  },
  {
    accessorKey: "deviceName",
    header: () => <div className="hidden sm:table-cell">Device</div>,
    cell: ({ row }) => (
      <div className="hidden sm:table-cell">{row.getValue("deviceName")}</div>
    ),
  },
  {
    accessorKey: "durationInSecs",
    header: () => <div className="hidden sm:table-cell">Duration</div>,
    cell: ({ row }) => {
      const durationInSecs: number | null = row.getValue("durationInSecs");
      const duration = durationInSecs
        ? Duration.fromObject({
            seconds: durationInSecs,
          }).toHuman()
        : "N/A";
      return <div className="hidden sm:table-cell">{duration}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const isAscending = column.getIsSorted() === "asc";
      return (
        <div
          className="hidden md:table-cell cursor-pointer"
          onClick={() => column.toggleSorting(isAscending)}
        >
          <div className="flex">
            Created at
            {!isAscending && <ArrowDown className="ml-1 h-4 w-4" />}
            {isAscending && <ArrowUp className="ml-1 h-4 w-4" />}
          </div>
        </div>
      );
    },
    cell: ({ row }) => {
      const createdAtString: string = row.getValue("createdAt");
      const createdAt = DateTime.fromISO(createdAtString).toLocaleString(
        DateTime.DATETIME_MED
      );
      return <div className="hidden md:table-cell">{createdAt}</div>;
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const status: JobStatus = row.getValue("status") || JobStatus.PENDING;
      return <JobStatusDiv className="ml-auto" status={status} />;
    },
  },
];

const jobFilterFormProps: DataTableFormConfig = {
  jobId: {
    validation: z.string(),
    defaultValue: "",
    label: "Job Id",
    getFormElement: (field: DataTableFilterField) => (
      <Input {...field} className="" />
    ),
  },
  deviceName: {
    validation: z.string(),
    defaultValue: "",
    label: "Device",
    getFormElement: (field: DataTableFilterField) => (
      <Input {...field} className="" />
    ),
  },
  status: {
    validation: z.nativeEnum(JobStatus).or(z.literal("")),
    defaultValue: "",
    label: "Status",
    getFormElement: ({ ref, ...props }: DataTableFilterField) => (
      <Select onValueChange={props.onChange} {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={JobStatus.FAILED}>Failed</SelectItem>
          <SelectItem value={JobStatus.SUCCESSFUL}>Successful</SelectItem>
          <SelectItem value={JobStatus.PENDING}>Pending</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
};

export function Home() {
  const { devices, jobs } = useLoaderData() as HomeData;
  const devicesOnlineRatio = React.useMemo(
    () =>
      Math.round(
        (devices.filter((v) => v.isOnline).length / devices.length) * 100
      ),
    [devices]
  );

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
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
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 lg:w-2/6">Device</TableHead>
                    <TableHead className="hidden lg:table-cell lg:w-1/6">
                      Qubits
                    </TableHead>
                    <TableHead className="text-right lg:text-left w-1/2 lg:w-1/6">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell lg:text-right lg:w-2/6">
                      Online Since
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.name}>
                      <TableCell>
                        <div className="font-medium">{device.name}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {device.numberOfQubits}
                      </TableCell>
                      <TableCell>
                        <DeviceStatusDiv
                          className="ml-auto lg:ml-0"
                          device={device}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell lg:text-right">
                        {device.lastOnline || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2"></div>
        </div>
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Jobs</CardTitle>
            <CardDescription>The status of your jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={jobTableColumns}
              data={jobs}
              filterFormProps={jobFilterFormProps}
              getDrawerContent={(row) => (
                <JobDetailDrawerContent job={row.original} />
              )}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/** Devices Table Cell */

function DeviceStatusDiv({ device, className = "" }: DeviceStatusDivProps) {
  return (
    <div className={cn("flex items-center w-fit", className)}>
      {device.isOnline ? (
        <>
          <Circle className={`fill-green-600 w-2 h-2 mr-1`} strokeWidth={0} />
          Online
        </>
      ) : (
        <>
          <CircleX className="fill-destructive w-2 h-2 mr-1" strokeWidth={0} />
          <span className="border-b border-dashed border-primary">Offline</span>
        </>
      )}
    </div>
  );
}

interface DeviceStatusDivProps {
  device: DeviceDetail;
  className?: string;
}

const statusIconMap: { [key: string]: React.ReactElement } = {
  [JobStatus.FAILED]: <CircleX className="stroke-destructive w-4 h-4 mr-1" />,
  [JobStatus.PENDING]: (
    <CircleDashed className="stroke-muted-foreground w-4 h-4 mr-1" />
  ),
  [JobStatus.SUCCESSFUL]: (
    <CircleCheck className="stroke-green-600 w-4 h-4 mr-1" />
  ),
};

function JobStatusDiv({ status, className = "" }: JobStatusDivProps) {
  const statusStringClass = React.useMemo(
    () =>
      status === JobStatus.FAILED
        ? "border-b border-dashed border-primary ml-1"
        : "ml-1",
    [status]
  );

  return (
    <div className={cn("flex items-center w-fit", className)}>
      {statusIconMap[status]}
      <span className={statusStringClass}>{status}</span>
    </div>
  );
}

interface JobStatusDivProps {
  status: JobStatus;
  className?: string;
}

function JobDetailDrawerContent({ job }: JobDetailDrawerProps) {
  return (
    <div className="h-full w-[300px] md:w-[500px] lg:w-[600px] xl:w-[700px] mt-4">
      <DrawerHeader>
        <DrawerTitle>Job: {job.jobId}</DrawerTitle>
        <DrawerDescription>Details about this job.</DrawerDescription>
      </DrawerHeader>
      <div className="p-4 pb-0">
        <div>
          <h4 className="text-md font-semibold mb-4">Details</h4>
          <div className="flex">
            <div className="mr-2 text-muted-foreground">Status: </div>
            <JobStatusDiv status={job.status} />
          </div>

          <div className="flex">
            <span className="mr-2 text-muted-foreground">Created at:</span>
            <span>
              {DateTime.fromISO(job.createdAt).toLocaleString(
                DateTime.DATETIME_MED
              )}
            </span>
          </div>

          <div className="flex">
            <span className="mr-2 text-muted-foreground">Device:</span>
            <span>{job.deviceName}</span>
          </div>

          <div className="flex">
            <span className="mr-2 text-muted-foreground">Duration:</span>
            <span>
              {job.durationInSecs
                ? Duration.fromObject({
                    seconds: job.durationInSecs,
                  }).toHuman()
                : "N/A"}
            </span>
          </div>

          {job.failureReason && (
            <div className="flex">
              <span className="mr-2 text-muted-foreground">Error:</span>
              <span>{job.failureReason}</span>
            </div>
          )}
        </div>
        <div className="mt-3"></div>
      </div>
    </div>
  );
}

interface JobDetailDrawerProps {
  job: JobDetail;
}

interface HomeData {
  devices: DeviceDetail[];
  jobs: JobDetail[];
}

export function loader(appState: AppState) {
  return async ({}: LoaderFunctionArgs) => {
    return { devices: deviceList, jobs: jobList } as HomeData;
  };
}
