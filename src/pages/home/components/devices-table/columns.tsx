import { DeviceStatusDiv } from "@/components/ui/device-status-div";
import { Device } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";

export const deviceTableColumns: ColumnDef<Device>[] = [
  {
    accessorKey: "name",
    header: "Device",
    meta: { headerClassName: "w-1/2 lg:w-2/6", rowClassName: "font-medium" },
  },
  {
    accessorKey: "numberOfQubits",
    header: "Qubits",
    meta: {
      headerClassName: "hidden lg:table-cell lg:w-1/6",
      rowClassName: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "isOnline",
    header: "Status",
    cell: ({ row }) => (
      <DeviceStatusDiv className="ml-auto lg:ml-0" device={row.original} />
    ),
    meta: {
      headerClassName: "text-right lg:text-left w-1/2 lg:w-1/6",
      rowClassName: "",
    },
  },
  {
    accessorKey: "createdAt",
    header: "Last Seen",

    cell: ({ row }) => (
      <>
        {row.original.lastOnline
          ? DateTime.fromISO(row.original.lastOnline).toRelative()
          : "N/A"}
      </>
    ),
    meta: {
      headerClassName: "hidden lg:table-cell lg:text-right lg:w-2/6",
      rowClassName: "hidden lg:table-cell lg:text-right",
    },
  },
];
