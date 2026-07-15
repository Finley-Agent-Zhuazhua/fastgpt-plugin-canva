import { describe, expect, it } from "vitest";
import toolSet from "./index";

describe("Canva manifest", () => {
  it("declares the Canva tool-set and its fixed API tools", () => {
    const manifest = toolSet.getUserToolManifest();
    expect(manifest.pluginId).toBe("canva");
    expect(manifest.version).toBe("0.1.0");
    expect(toolSet.getChildManifests().map((child) => child.id)).toEqual([
      "listDesigns",
      "getDesign",
      "createDesign",
      "exportDesign",
      "getExportJob",
    ]);
  });
});
