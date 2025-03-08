import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { app } from '../../../../../../utils/firebase';
import EventStage from './EventStage';
import MarketStage from './MarketStage';
import CouncelStage from './CouncelStage';
import SuspectStage from './SuspectStage';
import ResolutionStage from './ResolutionStage';

const db = getFirestore(app);

const stages = {
    1: EventStage,
    2: MarketStage,
    3: CouncelStage,
    4: SuspectStage,
    5: ResolutionStage
};

export default function StagePage() {
    const router = useRouter();
    const { stage, roomId, round } = router.query;

    useEffect(() => {
        if (!roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const gameData = snapshot.data();
            checkGameOver(gameData);
        });

        return () => unsubscribe();
    }, [roomId]);

    const checkGameOver = async (gameData) => {
        if (!gameData || !roomId) return;

        const alivePlayers = gameData.players.filter(player => player.alive);
        const aliveMurderers = alivePlayers.filter(player => player.isMurderer);
        const aliveVillagers = alivePlayers.filter(player => !player.isMurderer);
        let winner = "";

        // Condition: If Murderers outnumber Villagers, Murderers win
        if (aliveMurderers.length > aliveVillagers.length) {
            winner = "Murderers";
        }
        // Condition: If all alive players are Villagers, Villagers win
        else if (alivePlayers.every(player => !player.isMurderer)) {
            winner = "Villagers";
        }
        // Condition: If only two players remain
        else if (alivePlayers.length === 2) {
            // If at least one is a murderer, Murderers win
            winner = alivePlayers.some(player => player.isMurderer) ? "Murderers" : "Villagers";
        }


        if (winner) {
            try {
                const gameRef = doc(db, 'games', roomId);
                await updateDoc(gameRef, { winner });

                alert(`Game Over! ${winner} have won.`);
                router.push(`/game/${roomId}/game-results`); // Redirect to game over screen
            } catch (error) {
                console.error("Error updating game winner:", error);
            }
        }
    };

    const StageComponent = stages[stage] || (() => <p>Invalid Stage</p>);

    return <StageComponent stage={stage} roomId={roomId} round={round} />;
}
