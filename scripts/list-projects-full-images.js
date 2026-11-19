const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
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
  const snap = await getDocs(collection(db, "projects"));
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`\n=== [${doc.id}] "${d.title}" ===`);
    console.log("coverImage:", d.coverImage);
    console.log("images:", d.images);
  });
  process.exit(0);
}
run();
