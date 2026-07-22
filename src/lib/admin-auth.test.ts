import { describe, expect, it } from "vitest";
import { hasPlatformAdminRole } from "./admin-auth";

describe("hasPlatformAdminRole", () => {
  it("accepts only the trusted platform role in app metadata", () => {
    expect(
      hasPlatformAdminRole({ app_metadata: { platform_role: "admin" } }),
    ).toBe(true);
  });

  it("does not elevate a user from editable user metadata", () => {
    const userControlledRole = {
      app_metadata: {},
      user_metadata: { platform_role: "admin" },
    };

    expect(hasPlatformAdminRole(userControlledRole)).toBe(false);
  });

  it("rejects missing identities and unrelated roles", () => {
    expect(hasPlatformAdminRole(null)).toBe(false);
    expect(
      hasPlatformAdminRole({ app_metadata: { platform_role: "viewer" } }),
    ).toBe(false);
  });
});
