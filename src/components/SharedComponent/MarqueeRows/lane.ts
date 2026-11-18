/**
 * Horizontal lane shared by the marquee rows and the section headings, so the
 * first card lines up with the heading text at every width. The lane also
 * reserves the white side space for the 48px arrow buttons:
 * 12px phones, 16px large phones, 64px tablets (900px+), 72px desktops (1280px+).
 *
 * The padding lives in globals.css (`.marquee-lane`) rather than in utilities:
 * Tailwind v4 emits arbitrary `min-[...]` variants before the named `sm:`
 * breakpoint, so a stacked `px-3 sm:px-4 min-[900px]:px-16` lost to `sm:px-4`
 * at every width and the arrows sat on top of the cards.
 */
export const MARQUEE_LANE = 'marquee-lane'
