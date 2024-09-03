import { SortHeader } from "@/components/ui/data-table";
import { TokenStatusDiv } from "@/components/ui/token-status-div";
import { ColumnDef } from "@tanstack/table-core";
import type { ExtendedAppToken } from "types";
import { TimeDialog } from "./time-dialog";

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
      <TokenStatusDiv className="ml-auto lg:ml-0" token={row.original} />
    ),
  },
  {
    id: "actions",
    accessorFn: (row) => row.id,
    header: "Actions",
    cell: ({ row }) => (
      <TimeDialog token={row.original} isDisabled={row.original.is_expired} />
    ),
  },
];
