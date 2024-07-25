import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorInfo } from "../../types";
import { cn } from "@/lib/utils";
import { useNavigate, useRouteError } from "react-router-dom";

export default function ErrorAlert({ className = "" }: Props) {
  const error = useRouteError() as ErrorInfo;
  const navigate = useNavigate();
  console.error(error);

  return (
    <div
      id="error-page"
      className={cn(
        "flex h-full w-full items-center justify-center",
        className
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{error.status ?? "Oops!"}</CardTitle>
          <CardDescription className="text-lg">
            Sorry, an unexpected error has occurred.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            <i>
              {error?.statusText ||
                error?.message ||
                "Sorry, an unexpected error has occurred."}
            </i>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="link" onClick={() => navigate(-1)}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface Props {
  className?: string;
}
