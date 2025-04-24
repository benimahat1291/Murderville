import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const initializeMissionDivide = async (gameId, currentRound) => {
    const roundKey = String(currentRound);
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return;

    const gameData = gameSnap.data();
    const alivePlayers = gameData.players?.filter(p => p.alive) || [];

    // Shuffle and divide into two groups
    const shuffled = [...alivePlayers].sort(() => 0.5 - Math.random());
    const mid = Math.ceil(shuffled.length / 2);
    const groupA = shuffled.slice(0, mid);
    const groupB = shuffled.slice(mid);

    const preparePlayer = (p) => {
        let decision = null;

        if (p.isBot) {
            if (p.isMurderer) {
                decision = Math.random() < 0.75 ? "sabotage" : "pass";
            } else {
                decision = "pass";
            }
        }

        return {
            ...p,
            decision,
        };
    };


    const newEvent = {
        round: currentRound,
        gameState: "waiting",
        groupA: groupA.map(preparePlayer),
        groupB: groupB.map(preparePlayer),
        winners: [],
        losers: [],
    };

    await updateDoc(gameRef, {
        [`events.${roundKey}`]: newEvent,
        lastUpdated: serverTimestamp(),
    });
};
