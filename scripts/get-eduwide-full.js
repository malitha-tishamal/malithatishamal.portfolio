const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const firebaseConfig = {
  apiKey: "AIzaSyDvBozP-B9kN9obvqClhWN9zJGcNX2Nw4U",
  authDomain: "portfolio-aa68d.firebaseapp.com",
  projectId: "portfolio-aa68d",
  storageBucket: "portfolio-aa68d.firebasestorage.app",
  messagingSenderId: "367270381665",
  appId: "1:367270381665:web:531776cebf89d5cf1f379d",
  measurementId: "G-JBDZ7908X3"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
async function run() {
  const snap = await getDoc(doc(db, "projects", "project_1790585471489"));
  console.log(JSON.stringify(snap.data(), null, 2));
  process.exit(0);
}
run();
