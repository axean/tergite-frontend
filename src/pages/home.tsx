// export default function Home() {
//   // FIXME: If not logged in, redirect to login page
//   // TODO: This has the sidebar
//   return <div>Home</div>;
// }

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  File,
  Home as HomeIcon,
  LineChart,
  ListFilter,
  LucideProps,
  MoreVertical,
  Package,
  Package2,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users2,
  Cpu,
  FlaskRound,
  RefreshCcw,
  Circle,
  CircleX,
  CircleCheck,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  CircleDashed,
} from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import DonutChart from "@/components/ui/donut-chart";
import { DateTime, Duration } from "luxon";
import { DataTable } from "@/components/ui/data-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

enum JobStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

// FIXME: Add filtering etc.

const deviceList: DeviceDetail[] = [
  { name: "Loke", numberOfQubits: 8, isOnline: true, lastOnline: "2024-05-23" },
  { name: "Thor", numberOfQubits: 5, isOnline: false, lastOnline: null },
  {
    name: "Pingu",
    numberOfQubits: 20,
    isOnline: true,
    lastOnline: "2024-05-24",
  },
];

const projectList: ProjectDetail[] = [
  { name: "NordIQuEst", extId: "NordIQuEst-908" },
  { name: "OpenSuperQPlus", extId: "OpenSuperQPlus-765" },
  { name: "WACQT General", extId: "WACQT General-6452" },
];

const jobList: JobDetail[] = [
  {
    jobId: "1",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 400,
    createdAt: "2024-06-20T09:12:00.733Z",
  },
  {
    jobId: "2",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 500,
    createdAt: "2024-06-20T08:12:00.733Z",
  },
  {
    jobId: "3",
    deviceName: "Pingu",
    status: JobStatus.PENDING,
    durationInSecs: null,
    createdAt: "2024-06-11T10:12:00.733Z",
  },
  {
    jobId: "4",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 400,
    createdAt: "2024-06-20T11:12:00.733Z",
  },
  {
    jobId: "5",
    deviceName: "Pingu",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 800,
    createdAt: "2024-06-19T12:12:00.733Z",
  },
  {
    jobId: "6",
    deviceName: "Thor",
    status: JobStatus.FAILED,
    failureReason: "device offline",
    durationInSecs: 400,
    createdAt: "2024-06-20T23:12:00.733Z",
  },
];

const jobTableColumns: ColumnDef<JobDetail>[] = [
  {
    accessorKey: "jobId",
    header: "Job ID",
    cell: ({ row }) => <JobDetailDrawer job={row.original} />,
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

// FIXME: Make the entire row clickable
function JobDetailDrawer({ job }: JobDetailDrawerProps) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <div className="font-medium underline">{job.jobId}</div>
      </DrawerTrigger>
      <DrawerContent className="w-[500px] inset-y-0 right-0">
        <div className="h-full w-[400px] mt-4">
          <DrawerHeader>
            <DrawerTitle>Job: {job.jobId}</DrawerTitle>
            <DrawerDescription>Details about this job.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div>
              <h4 className="text-md font-semibold mb-4">Details</h4>
              <div className="flex">
                <div className="mr-2 text-muted-foreground">Status: </div>
                <div
                  className={
                    job.status === JobStatus.FAILED ? "text-destructive" : ""
                  }
                >
                  {job.status}
                </div>
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
      </DrawerContent>
    </Drawer>
  );
}

interface JobDetailDrawerProps {
  job: JobDetail;
}

export default function Home() {
  const devicesOnlineRatio = React.useMemo(
    () =>
      Math.round(
        (deviceList.filter((v) => v.isOnline).length / deviceList.length) * 100
      ),
    []
  );

  const [currentProject, setCurrentProject] = React.useState<string>(
    projectList[0].extId
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 flex-col border-r bg-background sm:flex">
          <Logo />
          <nav className="flex flex-col gap-4 px-6 sm:py-4">
            <NavItem to="/" IconClass={HomeIcon} text="Dashboard" />
            <NavItem
              to="/devices"
              isActive={true}
              IconClass={Cpu}
              text="Devices"
            />
            <NavItem to="/jobs" IconClass={FlaskRound} text="Jobs" />
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-48">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <Logo />
                <nav className="grid gap-6 text-lg font-medium">
                  <NavItem
                    to="/"
                    IconClass={HomeIcon}
                    text="Dashboard"
                    isBig={true}
                  />
                  <NavItem
                    to="/devices"
                    isActive={true}
                    IconClass={Cpu}
                    text="Devices"
                    isBig={true}
                  />
                  <NavItem
                    to="/jobs"
                    IconClass={FlaskRound}
                    text="Jobs"
                    isBig={true}
                  />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="mr-auto">Dashboard</div>
            <Select value={currentProject} onValueChange={setCurrentProject}>
              <SelectTrigger className="w-fit">
                <span className="hidden sm:inline text-muted-foreground pr-1">
                  Project:{" "}
                </span>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projectList.map((project) => (
                  <SelectItem value={project.extId} key={project.extId}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <img
                    src="/placeholder-user.jpg"
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Projects</DropdownMenuItem>
                <DropdownMenuItem>Tokens</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          {/* /Topbar */}

          {/* API-token-bar */}
          <header className="flex px-4 sm:px-6 py-4">
            <div className="relative w-full md:w-fit md:ml-auto flex items-center">
              <Label htmlFor="api-token" className="text-sm pr-2">
                API token
              </Label>
              <Input
                type="password"
                id="api-token"
                value={"some-value"}
                readOnly={true}
                className="w-full rounded-l-md rounded-r-none bg-background pr-8  md:w-[320px]"
              />
              <Button variant="outline" className="rounded-none" size="icon">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-l-none" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </header>
          {/* /API-token-bar */}

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
                        <CardDescription>
                          List of available devices
                        </CardDescription>
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
                          <TableHead className="w-1/2 lg:w-2/6">
                            Device
                          </TableHead>
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
                        {deviceList.map((device) => (
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
                  <DataTable columns={jobTableColumns} data={jobList} />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**NavItem */

function NavItem({
  to,
  isActive = false,
  isBig = false,
  IconClass,
  text,
}: NavItemProps) {
  const colorsClass = React.useMemo(
    () =>
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
    [isActive]
  );

  const sizeClass = React.useMemo(() => {
    return isBig
      ? {
          icon: "font-medium h-5 w-5",
          text: "text-lg font-medium",
          gap: "gap-4",
        }
      : { icon: "h-4 w-4", text: "text-sm", gap: "gap-2" };
  }, [isBig]);

  return (
    <Link
      to={to}
      className={`flex h-9 px-2 items-center ${colorsClass} rounded-md  transition-colors hover:text-foreground`}
    >
      <div className={`flex ${sizeClass.gap} items-center`}>
        <IconClass className={sizeClass.icon} />
        <span className={sizeClass.text}>{text}</span>
        <span className="sr-only">{text}</span>
      </div>
    </Link>
  );
}

interface NavItemProps {
  to: string;
  text: string;
  isActive?: boolean;
  isBig?: boolean;
  IconClass: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

/** Logo */

function Logo() {
  return (
    <Link
      to="/"
      className="group shrink-0 items-center text-center justify-center text-lg font-semibold px-2 sm:py-4"
    >
      <p className="text-2xl">WACQT</p>
      <p className="font-thin text-base">
        Wallenberg Centre for Quantum Technology
      </p>
      <span className="sr-only">
        WACQT: Wallenberg Centre for Quantum Technology
      </span>
    </Link>
  );
}

/** Devices Table Cell */

interface DeviceDetail {
  name: string;
  numberOfQubits: number;
  lastOnline: string | null | undefined;
  isOnline: boolean;
}

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

/** Projects Selection */

interface ProjectDetail {
  name: string;
  extId: string;
}

/** Job */

interface JobDetail {
  jobId: string;
  deviceName: string;
  status: JobStatus;
  failureReason?: string;
  durationInSecs: number | null | undefined;
  createdAt: string;
}
