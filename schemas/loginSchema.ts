import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address").min(2).max(50),
});

export type LoginSchema = z.infer<typeof loginSchema>;
