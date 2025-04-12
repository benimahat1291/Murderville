import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // ✅ Ensure Firebase is initialized

export const initializeGame = async (gameId, currentRound) => {
    console.log("initializeGame -> gameId", gameId, currentRound);
    if (!gameId || currentRound === undefined) return;

    const roundKey = String(currentRound);
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists()) {
        const gameData = gameSnap.data();

        // ✅ Normalize events object
        const events = typeof gameData.events === "object" && !Array.isArray(gameData.events)
            ? { ...gameData.events }
            : {};

        if (events[roundKey]) {
            console.log("⚠️ Event for this round already exists. Skipping initialization.");
            return;
        }

        console.log("🚀 Creating event for round", currentRound);

        const alivePlayers = gameData.players?.filter(p => p.alive) || [];
        const assignCards = () => [
            Math.floor(Math.random() * 13) + 1,
            Math.floor(Math.random() * 13) + 1
        ];

        const playersWithCards = alivePlayers.map(player => {
            const cards = assignCards();
            return {
                ...player,
                cards,
                choice: player.isBot ? cards.reduce((a, b) => a + b) >= 13 : null,
            };
        });

        const newEvent = {
            round: currentRound,
            players: playersWithCards,
            winners: [],
            losers: [],
            didnotplay: [],
            gameState: "waiting",
        };

        await updateDoc(gameRef, {
            [`events.${roundKey}`]: newEvent,
            lastUpdated: serverTimestamp(),
        });

        console.log("🔥 Game event initialized successfully in Firestore!");
    }
};
