import z from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Only letters, numbers and underscores allowed",
    }),
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
