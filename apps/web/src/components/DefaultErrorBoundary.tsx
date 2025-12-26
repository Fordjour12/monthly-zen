import { Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DefaultCatchErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <div className="min-w-0 flex-1 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="border-destructive/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <CardTitle className="text-base">Oops! Something went wrong</CardTitle>
            <CardDescription>
              We encountered an unexpected error. Don't worry, we're on it!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Alert variant="destructive" className="text-xs">
              <AlertDescription className="font-mono text-xs break-all">
                {error.message || "An unexpected error occurred"}
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                If this problem persists, please try refreshing the page or contact support.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2 justify-center pt-4">
            <Button
              onClick={() => {
                router.invalidate();
              }}
              size="sm"
              variant="default"
              className="flex-1"
            >
              Try Again
            </Button>
            {isRoot ? (
              <Link to="/">
                <Button size="sm" variant="outline" className="flex-1">
                  Go Home
                </Button>
              </Link>
            ) : (
              <Link
                to="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.back();
                }}
              >
                <Button size="sm" variant="outline" className="flex-1">
                  Go Back
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
