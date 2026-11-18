import { describe, expect, it } from "vitest";
import {
  FEATURED_PROJECTS_DEFAULTS,
  descriptionClampStyle,
  normalizeFeaturedProjectsSettings,
  validateFeaturedProjectsSettings,
} from "../featuredProjects";

describe("validateFeaturedProjectsSettings", () => {
  it("accepts a full valid payload", () => {
    const result = validateFeaturedProjectsSettings({
      tagsShown: 10,
      descriptionLines: 4,
      showVisitSite: false,
      cardsPerRow: 2,
      sectionTitle: "Selected Work",
      sectionSubtitle: "A few things I built.",
    });
    expect(result.ok).toBe(true);
    expect(result.settings).toEqual({
      tagsShown: 10,
      descriptionLines: 4,
      showVisitSite: false,
      cardsPerRow: 2,
      sectionTitle: "Selected Work",
      sectionSubtitle: "A few things I built.",
    });
  });

  it("fills missing keys with defaults", () => {
    const result = validateFeaturedProjectsSettings({ tagsShown: 5 });
    expect(result.ok).toBe(true);
    expect(result.settings.tagsShown).toBe(5);
    expect(result.settings.descriptionLines).toBe(
      FEATURED_PROJECTS_DEFAULTS.descriptionLines
    );
    expect(result.settings.cardsPerRow).toBe(3);
    expect(result.settings.showVisitSite).toBe(true);
  });

  it("rejects out-of-range and non-integer numbers", () => {
    expect(validateFeaturedProjectsSettings({ tagsShown: 0 }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ tagsShown: 21 }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ tagsShown: 2.5 }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ descriptionLines: 9 }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ cardsPerRow: 5 }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ tagsShown: "eight" }).ok).toBe(false);
  });

  it("rejects wrong types and empty titles", () => {
    expect(validateFeaturedProjectsSettings({ showVisitSite: "yes" }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ sectionTitle: "   " }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ sectionTitle: "x".repeat(500) }).ok).toBe(false);
    expect(validateFeaturedProjectsSettings({ sectionSubtitle: 42 }).ok).toBe(false);
  });

  it("ignores unknown keys", () => {
    const result = validateFeaturedProjectsSettings({
      tagsShown: 6,
      hacker: "value",
    });
    expect(result.ok).toBe(true);
    expect(result.settings).not.toHaveProperty("hacker");
  });

  it("rejects non-object bodies", () => {
    expect(validateFeaturedProjectsSettings(null).ok).toBe(true); // defaults
    expect(validateFeaturedProjectsSettings("nope").ok).toBe(true);
    expect(validateFeaturedProjectsSettings([1, 2]).ok).toBe(true);
  });
});

describe("normalizeFeaturedProjectsSettings", () => {
  it("clamps corrupted values instead of throwing", () => {
    const settings = normalizeFeaturedProjectsSettings({
      tagsShown: 999,
      descriptionLines: -4,
      cardsPerRow: 9,
      showVisitSite: "no",
      sectionTitle: "",
      sectionSubtitle: null,
    });
    expect(settings.tagsShown).toBe(20);
    expect(settings.descriptionLines).toBe(2);
    expect(settings.cardsPerRow).toBe(4);
    expect(settings.showVisitSite).toBe(true);
    expect(settings.sectionTitle).toBe(FEATURED_PROJECTS_DEFAULTS.sectionTitle);
    expect(settings.sectionSubtitle).toBe(FEATURED_PROJECTS_DEFAULTS.sectionSubtitle);
  });
});

describe("descriptionClampStyle", () => {
  it("maps the line count to an inline -webkit-box clamp", () => {
    expect(descriptionClampStyle(5)).toEqual({
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 5,
      overflow: "hidden",
    });
  });
});
