const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection, doc, updateDoc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDvBozP-B9kN9obvqClhWN9zJGcNX2Nw4U',
  authDomain: 'portfolio-aa68d.firebaseapp.com',
  projectId: 'portfolio-aa68d',
  storageBucket: 'portfolio-aa68d.firebasestorage.app',
  messagingSenderId: '68031141787',
  appId: '1:68031141787:web:9fae466a51db9ad0bc333e'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateSlug(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function truncate(str, max = 155) {
  if (!str) return '';
  const clean = str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 3).trim() + '...';
}

async function syncCollection(colName, typeLabel) {
  console.log(`\n=== Syncing ${colName} (${typeLabel}) ===`);
  const snap = await getDocs(collection(db, colName));
  const usedSlugs = new Set();
  const updates = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    let slug = data.slug;

    if (!slug) {
      let baseSlug = generateSlug(data.title || docSnap.id);
      if (!baseSlug) baseSlug = docSnap.id.toLowerCase();
      slug = baseSlug;
      let counter = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
    }
    usedSlugs.add(slug);

    const updatePayload = {};
    if (data.slug !== slug) {
      updatePayload.slug = slug;
    }
    if (!data.seoTitle && data.title) {
      updatePayload.seoTitle = `${data.title} | Malitha Tishamal`;
    }
    if (!data.seoDescription) {
      const desc = data.summary || data.description || `${data.title} - ${typeLabel} by Malitha Tishamal.`;
      updatePayload.seoDescription = truncate(desc, 155);
    }
    if (data.published === undefined) {
      updatePayload.published = true;
    }

    if (Object.keys(updatePayload).length > 0) {
      updates.push({ id: docSnap.id, title: data.title, slug, payload: updatePayload });
    }
  }

  for (const u of updates) {
    console.log(`Updating ${colName}/${u.id} -> slug: ${u.slug}`);
    await updateDoc(doc(db, colName, u.id), u.payload);
  }
  console.log(`Updated ${updates.length} items in ${colName}. Total items: ${snap.size}`);
}

async function run() {
  await syncCollection('projects', 'Project');
  await syncCollection('certifications', 'Certificate');
  await syncCollection('portfolio', 'Achievement / Portfolio');
  console.log('\nAll collections synced with clean slugs!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
