/**
 * Resolves the Firestore SDK + database lazily.
 *
 * Every module that used a top-level `import { db }` pulled ~55 kB of
 * Firestore into the initial JS for public pages. Awaiting this inside the
 * click/observer handler instead keeps first load fast; the module is shared,
 * so only the first caller pays for the dynamic import.
 */
export const withDb = async () => {
  const [mod, { getDb }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/firebaseApp"),
  ]);
  const db = await getDb();
  return { ...mod, db };
};
