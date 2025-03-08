import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../../../../utils/firebase';
import EventStage from './EventStage';
import MarketStage from './MarketStage';
import CouncelStage from './CouncelStage';
import SuspectStage from './SuspectStage';
import ResolutionStage from './ResolutionStage';
import KillBox from '../../../../../../components/KillBox';
import PlayerList from '../../../../../../components/PlayerList';

const db = getFirestore(app);
const auth = getAuth(app);

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
    const [gameData, setGameData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [murderers, setMurderers] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login'); // Redirect if not logged in
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            setGameData(data);
            checkGameOver(data);

            // Assign bot targets only if no entry exists for this round
            if (!data.killBox.some(kb => kb.round === data.currentRound)) {
                assignBotTargets(data);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (!gameData || !currentUser) return;

        // Find current player in gameData
        const player = gameData.players.find(p => p.uid === currentUser.uid);
        setCurrentPlayer(player || null);

        // If player is a murderer, get a list of all other murderers
        if (player?.isMurderer) {
            setMurderers(gameData.players.filter(p => p.isMurderer));
        }
    }, [gameData, currentUser]);

    const checkGameOver = async (gameData) => {
        if (!gameData || !roomId) return;

        const alivePlayers = gameData.players.filter(player => player.alive);
        const aliveMurderers = alivePlayers.filter(player => player.isMurderer);
        const aliveVillagers = alivePlayers.filter(player => !player.isMurderer);
        let winner = "";

        if (aliveMurderers.length > aliveVillagers.length) {
            winner = "Murderers";
        } else if (alivePlayers.every(player => !player.isMurderer)) {
            winner = "Villagers";
        } else if (alivePlayers.length === 2) {
            winner = alivePlayers.some(player => player.isMurderer) ? "Murderers" : "Villagers";
        }

        if (winner) {
            try {
                const gameRef = doc(db, 'games', roomId);
                await updateDoc(gameRef, { winner });
                alert(`Game Over! ${winner} have won.`);
                router.push(`/game/${roomId}/game-results`);
            } catch (error) {
                console.error("Error updating game winner:", error);
            }
        }
    };

    const assignBotTargets = async (gameData) => {
        if (!gameData || !roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const { currentRound, players, killBox } = gameData;

        // Check if there is already an entry for this round
        const roundExists = killBox.some(kb => kb.round === currentRound);
        if (roundExists) return; // Exit early if an entry already exists

        // Find alive non-murderer players (valid targets)
        const aliveVillagers = players.filter(player => player.alive && !player.isMurderer);
        if (aliveVillagers.length === 0) return; // No valid targets

        // Get only alive bot murderers
        const aliveBotMurderers = players.filter(player => player.alive && player.isMurderer && player.isBot);
        if (aliveBotMurderers.length === 0) return; // No bot murderers left alive

        let botTargets = {};
        aliveBotMurderers.forEach(bot => {
            const randomTarget = aliveVillagers[Math.floor(Math.random() * aliveVillagers.length)];
            botTargets[bot.uid] = randomTarget.uid;
        });

        const updatedKillBox = [
            ...killBox,
            { round: currentRound, targets: botTargets }
        ];

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
            console.log("Bot targets assigned for round:", currentRound);
        } catch (error) {
            console.error("Error updating bot targets:", error);
        }
    };

    const StageComponent = stages[stage] || (() => <p>Invalid Stage</p>);

    return (
        <div>
            <StageComponent stage={stage} roomId={roomId} round={round} currentUser={currentUser} />
            {gameData?.players.length && (
                <PlayerList players={gameData?.players} gameData={gameData} currentPlayer={currentPlayer} currentUser={currentUser} />
            )}
            <KillBox murderers={murderers} currentPlayer={currentPlayer} roomId={roomId} gameData={gameData} />
        </div>
    );
}
