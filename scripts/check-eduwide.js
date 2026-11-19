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
    if (d.title && d.title.toLowerCase().includes("eduwide")) {
      console.log("ID:", doc.id);
      console.log("title:", d.title);
      console.log("coverImage:", d.coverImage);
      console.log("images:", JSON.stringify(d.images));
      console.log("coverCrop:", JSON.stringify(d.coverCrop));
      console.log("imageCrops:", JSON.stringify(d.imageCrops));
    }
  });
  process.exit(0);
}
run();
