"use client";

/**
 * Non-render-blocking stylesheet for third-party icon fonts. The link starts as
 * a preload and is promoted to a stylesheet once it is fetched, so it never
 * blocks first paint (the Devicon CSS is ~145 kB).
 */
const AsyncStylesheet = ({ href }: { href: string }) => (
  <>
    <link
      rel="preload"
      as="style"
      href={href}
      onLoad={(event) => {
        const link = event.currentTarget;
        link.rel = "stylesheet";
        link.onload = null;
      }}
    />
    <noscript>
      <link rel="stylesheet" href={href} />
    </noscript>
  </>
);

export default AsyncStylesheet;
