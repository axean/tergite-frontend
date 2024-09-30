import { Circle, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ExtendedAppToken } from "../../../types";

export function TokenStatusDiv({ token, className = "" }: Props) {
  return (
    <div className={cn("flex items-center w-fit", className)}>
      {token.is_expired ? (
        <>
          <CircleX className="fill-destructive w-2 h-2 mr-1" strokeWidth={0} />
          <span className="border-b border-dashed border-primary">Expired</span>
        </>
      ) : (
        <>
          <Circle className={`fill-green-600 w-2 h-2 mr-1`} strokeWidth={0} />
          Live
        </>
      )}
    </div>
  );
}
interface Props {
  token: ExtendedAppToken;
  className?: string;
}
