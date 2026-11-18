/**
 * Horizontal lane shared by the marquee rows and the section headings, so the
 * first card lines up with the heading text at every width.
 *
 * The padding lives in globals.css (`.marquee-lane`) rather than in utilities:
 * Tailwind v4 emits arbitrary `min-[...]` variants before the named `sm:`
 * breakpoint, so a stacked `px-3 sm:px-4 min-[900px]:px-16` lost to `sm:px-4`
 * at every width and the arrows sat on top of the cards.
 */
export const MARQUEE_LANE = 'marquee-lane'
