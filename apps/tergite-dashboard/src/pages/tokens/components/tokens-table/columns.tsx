import { SortHeader } from "@/components/ui/data-table";
import { HealthStatus } from "@/components/ui/health-status";
import { ColumnDef } from "@tanstack/table-core";
import type { ExtendedAppToken } from "types";
import { TokenLifespanDialog } from "./lifespan-dialog";

export const columns: ColumnDef<ExtendedAppToken>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortHeader label="Title" column={column} />,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "project_ext_id",
    header: ({ column }) => (
      <SortHeader label="Project Ext ID" column={column} />
    ),
  },
  {
    accessorKey: "project_name",
    header: ({ column }) => <SortHeader label="Project" column={column} />,
  },
  {
    id: "expires_at",
    accessorFn: (row) => row.expires_at.toRelative(),
    header: ({ column }) => <SortHeader label="Expires" column={column} />,
  },
  {
    accessorKey: "is_expired",
    header: "Status",
    cell: ({ row }) => (
      <HealthStatus
        className="ml-auto lg:ml-0"
        isHealthy={!row.original.is_expired}
      />
    ),
  },
  {
    id: "actions",
    accessorFn: (row) => row.id,
    header: "Actions",
    cell: ({ row }) => (
      <TokenLifespanDialog
        token={row.original}
        isDisabled={row.original.is_expired}
      />
    ),
  },
];
