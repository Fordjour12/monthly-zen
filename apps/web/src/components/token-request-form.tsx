import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap } from "lucide-react";
import { requestMoreTokens } from "@/functions/request-more-tokens";
import { useNavigate } from "@tanstack/react-router";

// Zod schema for validation
const TokenRequestSchema = z.object({
  requestedAmount: z
    .number()
    .min(1, "Must request at least 1 token")
    .max(100, "Cannot request more than 100 tokens at once"),
  reason: z
    .string()
    .min(10, "Please provide a detailed reason (at least 10 characters)")
    .max(500, "Reason must be less than 500 characters"),
  urgency: z.enum(["low", "medium", "high"], {
    required_error: "Please select an urgency level",
  }),
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
      {field.state.meta.isValidating && <p className="text-sm text-foreground">Validating...</p>}
    </>
  );
}

interface TokenRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TokenRequestForm({ onSuccess, onCancel }: TokenRequestFormProps) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      requestedAmount: 10,
      reason: "",
      urgency: "medium" as "low" | "medium" | "high",
    },
    validators: {
      onChange: TokenRequestSchema,
      onBlur: TokenRequestSchema,
      onSubmit: TokenRequestSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await requestMoreTokens({ data: value });

        // Show success message and redirect
        if (onSuccess) {
          onSuccess();
        } else {
          navigate({ to: "/token" });
        }
      } catch (error) {
        console.error("Error requesting tokens:", error);
        throw error; // Let the form handle the error display
      }
    },
  });

  const suggestedAmounts = [5, 10, 20, 50];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Request More Tokens
        </CardTitle>
        <CardDescription>
          Fill out the form below to request additional generation tokens for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Requested Amount */}
          <Field>
            <FieldLabel htmlFor="requestedAmount">Number of Tokens</FieldLabel>
            <form.Field
              name="requestedAmount"
              children={(field) => (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="requestedAmount"
                      name={field.name}
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Enter number of tokens"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {suggestedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.handleChange(amount)}
                        className={field.state.value === amount ? "border-primary" : ""}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>

                  <FieldInfo field={field} />
                  <FieldDescription>
                    Choose how many additional tokens you need. Maximum 100 tokens per request.
                  </FieldDescription>
                </div>
              )}
            />
          </Field>

          {/* Urgency Level */}
          <Field>
            <FieldLabel htmlFor="urgency">Urgency Level</FieldLabel>
            <form.Field
              name="urgency"
              children={(field) => (
                <div className="space-y-2">
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as "low" | "medium" | "high")
                    }
                  >
                    <SelectTrigger
                      className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait a few days</SelectItem>
                      <SelectItem value="medium">Medium - Needed this week</SelectItem>
                      <SelectItem value="high">High - Needed immediately</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                  <FieldDescription>
                    Select how urgently you need the additional tokens.
                  </FieldDescription>
                </div>
              )}
            />
          </Field>

          {/* Reason */}
          <Field>
            <FieldLabel htmlFor="reason">Reason for Request</FieldLabel>
            <form.Field
              name="reason"
              children={(field) => (
                <div className="space-y-2">
                  <Textarea
                    id="reason"
                    name={field.name}
                    placeholder="Please explain why you need additional tokens and how you plan to use them..."
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`min-h-24 ${field.state.meta.errors.length > 0 ? "border-destructive" : ""}`}
                  />
                  <FieldInfo field={field} />
                  <FieldDescription>
                    Be specific about your needs to help us process your request faster.
                  </FieldDescription>
                </div>
              )}
            />
          </Field>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <>
                  <Button type="submit" disabled={!canSubmit || isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Request Tokens
                      </>
                    )}
                  </Button>

                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
