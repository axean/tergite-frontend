import { cn } from "@/lib/utils";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";

export function ProgressStatus<T>({
  status,
  className = "",
  pendingValue,
  successValue,
  failureValue,
}: Props<T>) {
  return (
    <div className={cn("flex items-center w-fit", className)}>
      {status === pendingValue && (
        <CircleDashed className="stroke-muted-foreground w-4 h-4 mr-1" />
      )}
      {status === successValue && (
        <CircleCheck className="stroke-green-600 w-4 h-4 mr-1" />
      )}
      {status === failureValue && (
        <CircleX className="stroke-destructive w-4 h-4 mr-1" />
      )}
      <span
        className={
          status === failureValue
            ? "border-b border-dashed border-primary ml-1"
            : "ml-1"
        }
      >
        {status as string}
      </span>
    </div>
  );
}

interface Props<T> {
  status: T;
  className?: string;
  pendingValue: T;
  successValue: T;
  failureValue: T;
}

// const statusIconMap: { [key: string]: React.ReactElement } = {
//   [JobStatus.FAILED]: <CircleX className="stroke-destructive w-4 h-4 mr-1" />,
//   [JobStatus.PENDING]: (
//     <CircleDashed className="stroke-muted-foreground w-4 h-4 mr-1" />
//   ),
//   [JobStatus.SUCCESSFUL]: (
//     <CircleCheck className="stroke-green-600 w-4 h-4 mr-1" />
//   ),
// };
