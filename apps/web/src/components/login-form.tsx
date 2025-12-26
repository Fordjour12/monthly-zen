import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Zod schema for validation
const LoginSchema = z.object({
  email: z.email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Reusable FieldInfo component for validation display
function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid && (
        <p className="text-sm text-destructive">
          {field.state.meta.errors.map((err) => err.message).join(",")}
        </p>
      )}
      {field.state.meta.isValidating && (
        <p className="text-sm text-muted-foreground">Validating...</p>
      )}
    </>
  );
}

export function LoginForm({
  className,
  onSubmit,
  isLoading = false,
  ...props
}: React.ComponentProps<"div"> & {
  onSubmit?: (values: { email: string; password: string }) => Promise<void> | void;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();

  //const {isPending} = authClient.useSession()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: LoginSchema,
      onBlur: LoginSchema,
      onSubmit: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/test-mock",
            });
            toast.success("Sign In successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
  });

  /*if(isPending){
      return <LoadingSkeletion/>
   }*/

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </FieldDescription>
          </div>

          {/* Email Field */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <form.Field
              name="email"
              children={(field) => (
                <div className="space-y-1">
                  <Input
                    id="email"
                    name={field.name}
                    type="email"
                    placeholder="m@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </Field>

          {/* Password Field */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <form.Field
              name="password"
              children={(field) => (
                <div className="space-y-1">
                  <Input
                    id="password"
                    name={field.name}
                    type="password"
                    placeholder="Enter your password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </Field>

          {/* Submit Button */}
          <Field>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? <>Signing in...</> : <>Login</>}
                </Button>
              )}
            />
          </Field>

          <FieldSeparator>Or</FieldSeparator>
          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Continue with Apple
            </Button>
            <Button variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
