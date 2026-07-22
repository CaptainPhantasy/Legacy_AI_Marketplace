import { describe, expect, it } from "vitest";
import {
  appFormSchema,
  appVersionSchema,
  parseIdentifier,
} from "./admin-validation";

describe("admin input validation", () => {
  it("normalizes a valid app payload", () => {
    const result = appFormSchema.parse({
      name: "  Research Assistant  ",
      slug: "research-assistant",
      description: "  Reviews source material.  ",
      icon: "🔎",
      category: "analysis",
    });

    expect(result.name).toBe("Research Assistant");
    expect(result.description).toBe("Reviews source material.");
  });

  it("rejects unsafe slugs and invalid identifiers", () => {
    expect(
      appFormSchema.safeParse({
        name: "Unsafe",
        slug: "../unsafe",
        description: "Invalid route input",
        icon: "!",
        category: "other",
      }).success,
    ).toBe(false);
    expect(parseIdentifier("not-a-uuid").success).toBe(false);
  });

  it("requires semantic versions and JSON objects", () => {
    expect(
      appVersionSchema.safeParse({
        versionNumber: "1.0",
        manifestJson: [],
        configSchemaJson: {},
        outputSchemaJson: {},
        runTemplate: "Run",
      }).success,
    ).toBe(false);

    expect(
      appVersionSchema.safeParse({
        versionNumber: "1.0.0",
        manifestJson: { name: "Test" },
        configSchemaJson: {},
        outputSchemaJson: {},
        runTemplate: "Run safely",
      }).success,
    ).toBe(true);
  });
});
