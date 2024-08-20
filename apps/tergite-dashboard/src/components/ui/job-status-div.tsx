import { JobStatus } from "../../../types";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import React from "react";

export function JobStatusDiv({ status, className = "" }: Props) {
  return (
    <div className={cn("flex items-center w-fit", className)}>
      {statusIconMap[status]}
      <span
        className={
          status === JobStatus.FAILED
            ? "border-b border-dashed border-primary ml-1"
            : "ml-1"
        }
      >
        {status}
      </span>
    </div>
  );
}

interface Props {
  status: JobStatus;
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
