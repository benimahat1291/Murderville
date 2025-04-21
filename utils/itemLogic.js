import { db } from './firebase';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

export const handleEndRound = async (game, roomId) => {
    if (!game || !roomId) return;

    console.log("Ending round...");

    const updatedPlayers = game.players.map(player => ({
        ...player,
        isProtected: false,
        isRevived: false,
        gold: (player.gold || 0) + 2,

    }));

    const gameRef = doc(db, 'games', roomId);

    try {
        await updateDoc(gameRef, {
            players: updatedPlayers,
        });
        console.log("✅ All player protections reset.");
    } catch (error) {
        console.error("❌ Failed to reset protection:", error);
    }
};



