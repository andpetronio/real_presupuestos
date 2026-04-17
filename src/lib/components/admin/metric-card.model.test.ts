import { describe, expect, it } from "vitest";
import {
  resolveTrendDirection,
  formatDeltaBadge,
  resolveDeltaColorClass,
  resolveValueColorClass,
} from "./metric-card.model";

describe("resolveTrendDirection", () => {
  it("returns neutral for null delta", () => {
    expect(resolveTrendDirection(null)).toBe("neutral");
  });

  it("returns neutral for 0", () => {
    expect(resolveTrendDirection(0)).toBe("neutral");
  });

  describe("positiveIsGood = true (default)", () => {
    it("returns up for positive delta", () => {
      expect(resolveTrendDirection(15.5, true)).toBe("up");
    });
    it("returns down for negative delta", () => {
      expect(resolveTrendDirection(-8.0, true)).toBe("down");
    });
  });

  describe("positiveIsGood = false (e.g., rejection rate)", () => {
    it("returns down for positive delta", () => {
      expect(resolveTrendDirection(5.0, false)).toBe("down");
    });
    it("returns up for negative delta (improvement)", () => {
      expect(resolveTrendDirection(-3.0, false)).toBe("up");
    });
  });
});

describe("formatDeltaBadge", () => {
  it("returns empty string for null delta", () => {
    expect(formatDeltaBadge(null)).toBe("");
  });

  it("formats positive delta with up arrow", () => {
    expect(formatDeltaBadge(12.5)).toBe("↑ 12.5%");
  });

  it("formats negative delta with down arrow", () => {
    expect(formatDeltaBadge(-8.0)).toBe("↓ 8.0%");
  });

  it("formats zero with no arrow", () => {
    expect(formatDeltaBadge(0)).toBe(" 0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatDeltaBadge(12.567)).toBe("↑ 12.6%");
    expect(formatDeltaBadge(-0.01)).toBe("↓ 0.0%");
  });
});

describe("resolveDeltaColorClass", () => {
  it("returns gray for null delta", () => {
    expect(resolveDeltaColorClass(null, "neutral")).toBe("text-gray-500");
  });

  it("returns green-600 for up trend", () => {
    expect(resolveDeltaColorClass(5, "up")).toBe("text-green-600");
  });

  it("returns red-600 for down trend", () => {
    expect(resolveDeltaColorClass(-5, "down")).toBe("text-red-600");
  });

  it("returns gray for neutral", () => {
    expect(resolveDeltaColorClass(0, "neutral")).toBe("text-gray-500");
  });
});

describe("resolveValueColorClass", () => {
  it("returns text-gray-900 for default", () => {
    expect(resolveValueColorClass("default")).toBe("text-gray-900");
  });
  it("returns text-accent-600 for accent", () => {
    expect(resolveValueColorClass("accent")).toBe("text-accent-600");
  });
  it("returns text-secondary-700 for secondary", () => {
    expect(resolveValueColorClass("secondary")).toBe("text-secondary-700");
  });
  it("returns text-primary-700 for primary", () => {
    expect(resolveValueColorClass("primary")).toBe("text-primary-700");
  });
});
