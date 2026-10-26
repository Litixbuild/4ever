import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Vista } from "./vista";

describe("Vista", () => {
  it("renders for any seed, including ones with large hashes", () => {
    const seeds = ["", "a", "abcdef1x", "k3J9xP2a", "tarren-mill", "x".repeat(200), "ZZZZZZZZ", "velrisk0"];
    for (let i = 0; i < 500; i++) seeds.push(Math.random().toString(36).slice(2, 10));
    for (const seed of seeds) {
      const html = renderToStaticMarkup(<Vista seed={seed} />);
      expect(html).toContain("<svg");
      expect(html).not.toContain("undefined");
    }
  });
});
