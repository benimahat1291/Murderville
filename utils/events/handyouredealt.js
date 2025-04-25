import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { generateDeck, getCardValue } from "./cards";

export const initializeGame = async (gameId, currentRound) => {
    console.log("initializeGame -> gameId", gameId, currentRound);
    if (!gameId || currentRound === undefined) return;

    const roundKey = String(currentRound);
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (gameSnap.exists()) {
        const gameData = gameSnap.data();

        const events = typeof gameData.events === "object" && !Array.isArray(gameData.events)
            ? { ...gameData.events }
            : {};

        if (events[roundKey]) {
            console.log("⚠️ Event for this round already exists. Skipping initialization.");
            return;
        }

        console.log("🚀 Creating event for round", currentRound);

        const alivePlayers = gameData.players?.filter(p => p.alive) || [];
        const fullDeck = generateDeck();
        const deck = [...fullDeck].sort(() => 0.5 - Math.random());

        const drawTwoCards = () => [deck.pop(), deck.pop()];

        const playersWithCards = alivePlayers.map(player => {
            const cards = drawTwoCards();
            const total =
                getCardValue(cards[0].rank) + getCardValue(cards[1].rank);

            return {
                ...player,
                cards,
                choice: player.isBot ? total >= 13 : null,
            };
        });

        const newEvent = {
            round: currentRound,
            players: playersWithCards,
            winners: [],
            losers: [],
            didnotplay: [],
            gameState: "waiting",
            gameType: "hand-youre-dealt",
        };

        await updateDoc(gameRef, {
            [`events.${roundKey}`]: newEvent,
            lastUpdated: serverTimestamp(),
        });

        console.log("🔥 Game event initialized successfully in Firestore!");
    }
};
