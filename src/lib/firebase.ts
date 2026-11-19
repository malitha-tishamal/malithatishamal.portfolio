import { getFirestore, Firestore } from "firebase/firestore";
import { app } from "./firebaseApp";

/**
 * Firestore-backed entry point for admin screens.
 *
 * Public pages should import from `@/lib/firebaseApp` and lazily call
 * `getDb()` so the Firestore runtime is not part of the first load.
 */

export const db: Firestore = getFirestore(app);

export {
  app,
  loadFirestore,
  getDb,
  loadAuthModule,
  getFirebaseAuth,
  getSocialProviders,
} from "./firebaseApp";

export default app;
