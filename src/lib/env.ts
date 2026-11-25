import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  AUTH_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error("Invalid environment variables:\n" + problems);
  throw new Error("Invalid environment variables. Check your .env file.");
}

export const env = parsed.data;