import { describe, expect, it } from "vitest";
import { listRegisteredAddons, resolveAddonDefinitions, resolveSlideAddons } from "./registry";
import { Insight } from "./insight/Insight";
import { InsightAddonProvider } from "./insight/InsightAddonProvider";
import { SpotlightLayout } from "./insight/SpotlightLayout";

describe("addon registry", () => {
  it("registers local addons discovered from the addons directory", () => {
    const addonIds = listRegisteredAddons().map((addon) => addon.id);

    expect(addonIds).toContain("insight");
  });

  it("ignores missing addons while preserving known ones", () => {
    const definitions = resolveAddonDefinitions(["insight", "missing-addon"]);

    expect(definitions.map((definition) => definition.id)).toEqual(["insight"]);
  });

  it("merges addon layouts, mdx components, and providers", () => {
    const addons = resolveSlideAddons(["insight"]);

    expect(addons.definitions.map((definition) => definition.id)).toEqual(["insight"]);
    expect(addons.layouts.spotlight).toBe(SpotlightLayout);
    expect(addons.mdxComponents.Insight).toBe(Insight);
    expect(addons.providers).toEqual([InsightAddonProvider]);
  });
});
