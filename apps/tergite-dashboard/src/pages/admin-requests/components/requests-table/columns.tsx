import { SortHeader } from "@/components/ui/data-table";
import { ProgressStatus } from "@/components/ui/progress-status";
import { getUserRequestTitle } from "@/lib/utils";
import { ColumnDef } from "@tanstack/table-core";
import { DateTime } from "luxon";
import type { UserRequest } from "types";

// created_at: string;
// updated_at: string;
// status: UserRequestStatus;
// type: UserRequestType;
// requester_id: string;
// requester_name?: string;
// approver_id?: string; // id of admin who has handled it
// approver_name?: string;
// rejection_reason?: string;
// request: unknown;

export const columns: ColumnDef<UserRequest>[] = [
  {
    id: "title",
    accessorFn: (req) => getUserRequestTitle(req),
    header: ({ column }) => <SortHeader label="Title" column={column} />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortHeader label="Type" column={column} />,
  },
  {
    accessorKey: "requester_name",
    header: ({ column }) => <SortHeader label="Requested by" column={column} />,
  },
  {
    id: "created_at",
    accessorFn: (row) => DateTime.fromISO(row.created_at).toRelative(),
    header: ({ column }) => <SortHeader label="Created" column={column} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <ProgressStatus
        status={row.original.status}
        pendingValue="pending"
        successValue="approved"
        failureValue="rejected"
      />
    ),
  },
];
