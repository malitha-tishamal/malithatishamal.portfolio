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
  console.log("Total projects:", snap.size);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`- [${doc.id}] order:${d.displayOrder} title:"${d.title}" cover:"${d.coverImage?.slice(0, 50)}" images_count:${d.images?.length} updatedAt:"${d.updatedAt}"`);
  });
  process.exit(0);
}
run();
