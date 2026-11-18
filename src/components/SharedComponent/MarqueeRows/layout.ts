/**
 * Row splitting for the two-row marquee.
 *
 * Row 1 gets the first half (the extra card when the count is odd), Row 2 gets
 * the remaining items in reverse so it starts from the last card and travels
 * the other way. The slices are disjoint by construction — a card can never
 * appear in both rows.
 */
export function splitMarqueeRows<T>(
  items: T[],
  rowCount = 2,
  minForTwoRows = 6
): T[][] {
  if (items.length === 0) return [];
  if (rowCount < 2 || items.length < minForTwoRows) return [items];

  const rows: T[][] = [];
  const size = Math.ceil(items.length / rowCount);
  for (let index = 0; index < rowCount; index += 1) {
    rows.push(items.slice(index * size, (index + 1) * size));
  }
  for (let index = 1; index < rows.length; index += 1) {
    rows[index].reverse();
  }
  return rows.filter((row) => row.length > 0);
}

/** Number of cards per row (used in tests and for arrow steps). */
export function marqueeRowSizes<T>(items: T[], rowCount = 2, minForTwoRows = 6): number[] {
  return splitMarqueeRows(items, rowCount, minForTwoRows).map((row) => row.length);
}
