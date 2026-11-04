import { describe, expect, it } from "vitest";
import { LOGIN_ERRORS, loginErrorMessage } from "./login-errors";

describe("loginErrorMessage", () => {
  it("only shows the site's own messages", () => {
    expect(loginErrorMessage("cancelled")).toBe(LOGIN_ERRORS.cancelled);
    expect(loginErrorMessage(null)).toBeNull();
    // Text typed into the link is never shown.
    expect(loginErrorMessage("Your account is locked, call 555-0100")).toBe(LOGIN_ERRORS.failed);
    expect(loginErrorMessage("toString")).toBe(LOGIN_ERRORS.failed);
  });
});
