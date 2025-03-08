import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // ✅ Ensure Firebase is initialized

export const initializeGame = async (gameId, currentRound) => {
    console.log("initializeGame -> gameId", gameId, currentRound);
    if (!gameId || currentRound === undefined) return;

    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists()) {
        const gameData = gameSnap.data();

        // Ensure events is an array
        const events = Array.isArray(gameData.events) ? gameData.events : Object.values(gameData.events || {});

        // Find all alive players
        const alivePlayers = gameData.players ? gameData.players.filter(p => p.alive === true) : [];

        // Assign two random cards to each alive player
        const assignCards = () => [Math.floor(Math.random() * 13) + 1, Math.floor(Math.random() * 13) + 1];

        const playersWithCards = alivePlayers.map(player => ({
            ...player,
            choice: player.isBot ? (assignCards().reduce((a, b) => a + b) >= 13) : null, // Bots auto-decide
            cards: assignCards(),
        }));

        // Check if the event already exists
        const existingEvent = events.find(event => event.round === currentRound);

        if (!existingEvent) {
            console.log("🚀 Event does not exist, creating new event...");

            const newEvent = {
                round: currentRound,
                players: playersWithCards,
                winners: [],
                losers: [],
                result: [],
                didnotplay: [],
                gameState: "waiting",
            };

            const updatedEvents = [...events, newEvent];

            await updateDoc(gameRef, {
                events: updatedEvents, // Ensure Firestore gets the full updated array
                lastUpdated: serverTimestamp(),
            });

            console.log("🔥 Game event initialized successfully in Firestore!");
        } else {
            console.log("⚠️ Event for this round already exists. Skipping initialization.");
        }
    }
};
