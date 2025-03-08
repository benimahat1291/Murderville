import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

import characters from '../utils/data/characters.js';
import events from '../utils/data/events.js';
import items from '../utils/data/items.js';

// Load Service Account Key
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
    await readFile(path.join(__dirname, '../serviceAccountKey.json'), 'utf-8')
);

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Seed Data Function
async function seedFirestore() {
    await seedCollection('characters', characters);
    await seedCollection('events', events);
    await seedCollection('items', items);
    console.log('✅ Firestore successfully seeded!');
    process.exit();
}

// Helper Function to Seed a Collection
async function seedCollection(collectionName, data) {
    const collectionRef = db.collection(collectionName);

    for (const entry of data) {
        const docRef = collectionRef.doc(); // Auto-generate doc ID
        await docRef.set(entry);
    }
}

// Run the script
seedFirestore().catch(console.error);
