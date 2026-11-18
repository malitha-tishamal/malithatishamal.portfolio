import { describe, expect, it } from "vitest";
import { marqueeRowSizes, splitMarqueeRows } from "../layout";

const items = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe("splitMarqueeRows", () => {
  it("returns nothing for an empty list", () => {
    expect(splitMarqueeRows([])).toEqual([]);
  });

  it("falls back to a single row below the minimum", () => {
    const row = splitMarqueeRows(items(5));
    expect(row).toHaveLength(1);
    expect(row[0]).toEqual([1, 2, 3, 4, 5]);
  });

  it("splits six cards into two equal rows", () => {
    expect(splitMarqueeRows(items(6))).toEqual([
      [1, 2, 3],
      [6, 5, 4],
    ]);
  });

  it("gives row 1 the extra card when the count is odd", () => {
    expect(splitMarqueeRows(items(7))).toEqual([
      [1, 2, 3, 4],
      [7, 6, 5],
    ]);
  });

  it("starts row 2 from the last card and travels backwards", () => {
    const [rowOne, rowTwo] = splitMarqueeRows(items(8));
    expect(rowOne[0]).toBe(1);
    expect(rowTwo[0]).toBe(8);
    expect(rowTwo).toEqual([8, 7, 6, 5]);
  });

  it("never puts the same card in both rows", () => {
    for (let count = 6; count <= 25; count += 1) {
      const [rowOne, rowTwo] = splitMarqueeRows(items(count));
      const overlap = rowOne.filter((item) => rowTwo.includes(item));
      expect(overlap).toEqual([]);
      expect(rowOne.length + rowTwo.length).toBe(count);
    }
  });

  it("supports more than two rows", () => {
    const rows = splitMarqueeRows(items(9), 3);
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe(6);
    expect(rows[2][0]).toBe(9);
  });
});

describe("marqueeRowSizes", () => {
  it("reports the card count per row", () => {
    expect(marqueeRowSizes(items(6))).toEqual([3, 3]);
    expect(marqueeRowSizes(items(7))).toEqual([4, 3]);
    expect(marqueeRowSizes(items(5))).toEqual([5]);
    expect(marqueeRowSizes(items(0))).toEqual([]);
  });
});
