import { SortHeader } from "@/components/ui/data-table";
import { JobStatusDiv } from "@/components/ui/job-status-div";
import { Job, JobStatus } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime, Duration } from "luxon";

export const jobTableColumns: ColumnDef<Job>[] = [
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
    header: ({ column }) => (
      <SortHeader
        column={column}
        label="Created at"
        className="hidden md:table-cell "
      />
    ),
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
      const status: JobStatus = row.getValue("status") || "pending";
      return <JobStatusDiv className="ml-auto" status={status} />;
    },
  },
];
