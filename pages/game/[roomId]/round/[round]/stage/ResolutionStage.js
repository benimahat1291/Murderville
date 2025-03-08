import useGameData from '../../../../../../hooks/useGameData';
import PlayerList from '../../../../../../components/PlayerList';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

export default function ResolutionStage({ roomId, round, stage }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();
    const db = getFirestore();

    const [killedPlayer, setKilledPlayer] = useState(null);

    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);
            }
        }
    }, [game.currentRound, game.currentStage, router]);

    useEffect(() => {
        if (!game.killBox || !players) return;

        // Get current round killBox entry
        const roundKillBoxIndex = game.killBox.findIndex(kb => kb.round === game.currentRound);
        if (roundKillBoxIndex === -1) return;

        const roundKillBox = game.killBox[roundKillBoxIndex];

        // If a player has already been killed in this round, exit early
        if (roundKillBox.killed) {
            setKilledPlayer(roundKillBox.killed);
            return;
        }

        if (!roundKillBox.targets) return;

        // Get a list of alive murderers
        const aliveMurderers = players.filter(player => player.isMurderer && player.alive).map(p => p.uid);

        // Count votes, only considering votes from alive murderers
        const targetCounts = {};
        Object.entries(roundKillBox.targets).forEach(([murdererUid, targetUid]) => {
            if (aliveMurderers.includes(murdererUid)) {
                targetCounts[targetUid] = (targetCounts[targetUid] || 0) + 1;
            }
        });

        // If no valid votes exist, exit early
        if (Object.keys(targetCounts).length === 0) return;

        // Find player with most votes
        const maxVotes = Math.max(...Object.values(targetCounts));
        const potentialKills = Object.keys(targetCounts).filter(uid => targetCounts[uid] === maxVotes);

        // Pick the most targeted or a random one if there's a tie
        const selectedKillUid = potentialKills.length === 1
            ? potentialKills[0]
            : potentialKills[Math.floor(Math.random() * potentialKills.length)];

        const killedPlayerData = players.find(p => p.uid === selectedKillUid);
        if (!killedPlayerData) return;

        setKilledPlayer(killedPlayerData);

        // Update Firestore
        const gameRef = doc(db, 'games', roomId);
        const updatedPlayers = players.map(player =>
            player.uid === killedPlayerData.uid ? { ...player, alive: false } : player
        );

        const updatedKillBox = game.killBox.map((kb, index) =>
            index === roundKillBoxIndex ? { ...kb, killed: killedPlayerData } : kb
        );

        updateDoc(gameRef, {
            players: updatedPlayers,
            killBox: updatedKillBox
        }).then(() => {
            console.log("Updated killed player:", killedPlayerData);
        }).catch(error => {
            console.error("Error updating killed player:", error);
        });
    }, [game.killBox, players, game.currentRound, roomId, db]);

    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };

    const isHost = game.hostId === currentUser?.uid;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Round {round} - Stage {stage}: The Reveal</h1>
            <p>Results revealed. Who was exiled/killed?</p>

            {killedPlayer && (
                <p className="mt-2 text-red-500 font-bold">
                    {killedPlayer.name} ({killedPlayer.character}) was eliminated!
                </p>
            )}

            {isHost && (
                <button
                    onClick={handleNext}
                    className="mt-4 bg-green-500 px-4 py-2 text-white rounded"
                >
                    Next Stage
                </button>
            )}
        </div>
    );
}
