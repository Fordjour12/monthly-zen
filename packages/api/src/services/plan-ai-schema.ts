import { z } from "zod";

export const generateInputSchema = z.object({
  goalsText: z.string().min(1, "Goals are required"),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
  focusAreas: z.string().min(1, "Focus areas are required"),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
  fixedCommitmentsJson: z.object({
    commitments: z.array(
      z.object({
        dayOfWeek: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string(),
      }),
    ),
  }),
});

export type GeneratePlanInput = z.infer<typeof generateInputSchema>;
