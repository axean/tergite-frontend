import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { JobStatusDiv } from "@/components/ui/job-status-div";
import { Job } from "@/lib/types";
import { DateTime, Duration } from "luxon";

export function JobDetailDrawerContent({ job }: Props) {
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

interface Props {
  job: Job;
}
