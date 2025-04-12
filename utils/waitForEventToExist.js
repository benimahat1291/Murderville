// utils/waitForEventToExist.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const waitForEventToExist = async (gameId, currentRound, maxRetries = 5, delay = 400) => {
    const gameRef = doc(db, "games", gameId);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const gameSnap = await getDoc(gameRef);
        const gameData = gameSnap.data();
        const events = Array.isArray(gameData.events)
            ? gameData.events
            : Object.values(gameData.events || {});
        const event = events.find(e => e.round === currentRound);

        if (event) {
            console.log(`✅ Found event after ${attempt} attempt(s).`);
            return event;
        }

        console.log(`⏳ Event not found, retrying in ${delay}ms (attempt ${attempt})`);
        await new Promise((res) => setTimeout(res, delay));
    }

    throw new Error(`❌ Event for round ${currentRound} not found after ${maxRetries} retries.`);
};
