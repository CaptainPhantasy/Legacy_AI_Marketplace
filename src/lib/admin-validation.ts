import { z } from "zod";

const identifier = z.string().uuid();
const category = z.enum([
  "productivity",
  "analysis",
  "automation",
  "communication",
  "other",
]);
const jsonObject = z.record(z.string(), z.unknown());

export const appFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens",
    ),
  description: z.string().trim().min(1, "Description is required").max(2_000),
  icon: z.string().trim().max(16).default("📱"),
  category: category.default("other"),
});

export const appVersionSchema = z.object({
  versionNumber: z
    .string()
    .trim()
    .regex(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,
      "Use a semantic version such as 1.0.0",
    ),
  manifestJson: jsonObject,
  configSchemaJson: jsonObject,
  outputSchemaJson: jsonObject,
  runTemplate: z.string().trim().min(1, "Run template is required").max(50_000),
});

export function parseAppForm(formData: FormData) {
  return appFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    icon: formData.get("icon") || "📱",
    category: formData.get("category") || "other",
  });
}

export function parseIdentifier(value: string) {
  return identifier.safeParse(value);
}
