import { DeviceStatusDiv } from "@/components/ui/device-status-div";
import { Device } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";

export const deviceTableColumns: ColumnDef<Device>[] = [
  {
    accessorKey: "name",
    header: "Device",
    meta: { headerClassName: "", rowClassName: "font-medium" },
  },
  {
    accessorKey: "numberOfQubits",
    header: "Qubits",
    meta: {
      headerClassName: "hidden lg:table-cell",
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
      headerClassName: "text-right lg:text-left",
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
      headerClassName: "hidden lg:table-cell lg:text-right",
      rowClassName: "hidden lg:table-cell lg:text-right",
    },
  },
];
