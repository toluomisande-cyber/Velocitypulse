import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps the last conflicting Tailwind utility", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("combines conditional class values", () => {
    expect(cn("text-sm", false && "hidden", ["font-medium"])).toBe(
      "text-sm font-medium"
    );
  });
});
