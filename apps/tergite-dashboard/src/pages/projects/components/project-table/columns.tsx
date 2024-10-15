import { SortHeader } from "@/components/ui/data-table";
import { HealthStatus } from "@/components/ui/health-status";
import { ColumnDef } from "@tanstack/table-core";
import { QpuTimeExtensionUserRequest, User, type Project } from "types";
import { QpuTimeDialog } from "./qpu-time-dialog";
import { Duration } from "luxon";

export function getColumns({
  currentUser,
  qpuTimeRequests,
}: {
  currentUser: User;
  qpuTimeRequests: QpuTimeExtensionUserRequest[];
}): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortHeader label="Name" column={column} />,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "ext_id",
      header: ({ column }) => (
        <SortHeader label="External ID" column={column} />
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <HealthStatus
          className="ml-auto lg:ml-0"
          isHealthy={row.original.is_active}
        />
      ),
    },
    {
      id: "qpu_seconds",
      accessorFn: (row) =>
        Duration.fromObject({ seconds: row.qpu_seconds }).toHuman(),
      header: ({ column }) => (
        <SortHeader label="Available QPU time" column={column} />
      ),
    },
    {
      id: "requests",
      accessorFn: (row) => row.id,
      header: "Requests",
      cell: ({ row }) => (
        <QpuTimeDialog
          currentUser={currentUser}
          qpuTimeRequests={qpuTimeRequests}
          project={row.original}
        />
      ),
    },
  ];
}
