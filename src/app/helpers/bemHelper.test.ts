import { describe, it, expect } from "vitest";
import bemCondition, { bemHelper, cn } from "./bemHelper";

describe("bemCondition", () => {
  it("returns base class when no modifiers", () => {
    expect(bemCondition("block")).toBe("block");
  });

  it("applies single modifier with condition true", () => {
    expect(bemCondition("block", "modifier", true)).toBe(
      "block block--modifier",
    );
  });

  it("does not apply single modifier with condition false", () => {
    expect(bemCondition("block", "modifier", false)).toBe("block block--");
  });

  it("applies first modifier when condition true with array", () => {
    expect(bemCondition("block", ["active", "inactive"], true)).toBe(
      "block block--active",
    );
  });

  it("applies second modifier when condition false with array", () => {
    expect(bemCondition("block", ["active", "inactive"], false)).toBe(
      "block block--inactive",
    );
  });

  it("applies modifier when condition undefined with string", () => {
    expect(bemCondition("block", "modifier")).toBe("block block--modifier");
  });
});

describe("bemHelper", () => {
  it("throws error when block name is empty", () => {
    expect(() => bemHelper("")).toThrow(
      "Block name is required and cannot be empty",
    );
    expect(() => bemHelper("   ")).toThrow(
      "Block name is required and cannot be empty",
    );
  });

  it("returns block class without element or modifiers", () => {
    const bem = bemHelper("block");
    expect(bem()).toBe("block");
  });

  it("returns element class", () => {
    const bem = bemHelper("block");
    expect(bem("element")).toBe("block__element");
  });

  it("returns block with string modifier", () => {
    const bem = bemHelper("block");
    expect(bem(null, "modifier")).toBe("block block--modifier");
  });

  it("returns element with string modifier", () => {
    const bem = bemHelper("block");
    expect(bem("element", "modifier")).toBe(
      "block__element block__element--modifier",
    );
  });

  it("handles array modifiers", () => {
    const bem = bemHelper("block");
    expect(bem("element", ["mod1", "mod2"])).toBe(
      "block__element block__element--mod1 block__element--mod2",
    );
  });

  it("handles object modifiers", () => {
    const bem = bemHelper("block");
    expect(
      bem("element", { active: true, disabled: false, loading: true }),
    ).toBe("block__element block__element--active block__element--loading");
  });

  it("filters out falsy array modifiers", () => {
    const bem = bemHelper("block");
    expect(bem("element", ["mod1", "", null, "mod2"])).toBe(
      "block__element block__element--mod1 block__element--mod2",
    );
  });
});

describe("cn", () => {
  it("handles string inputs", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles array inputs", () => {
    expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
  });

  it("handles object inputs", () => {
    expect(cn({ active: true, disabled: false, loading: true })).toBe(
      "active loading",
    );
  });

  it("handles mixed inputs", () => {
    expect(
      cn("base", ["mod1", "mod2"], { active: true, disabled: false }),
    ).toBe("base mod1 mod2 active");
  });

  it("filters out falsy values", () => {
    expect(cn("class1", null, undefined, false, "", "class2")).toBe(
      "class1 class2",
    );
  });

  it("removes duplicates", () => {
    expect(cn("class1", "class2", "class1")).toBe("class1 class2");
  });

  it("trims whitespace", () => {
    expect(cn("  class1  ", "  class2  ")).toBe("class1 class2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("", null, undefined)).toBe("");
  });
});
