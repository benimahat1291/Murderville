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
import PlayerBox from '../../../../../../components/PlayerBox';
import Page from '../../../../../../components/layout/Page';

const db = getFirestore(app);
const auth = getAuth(app);

// Mapping stage numbers to their corresponding components
const stages = {
    1: EventStage,
    2: MarketStage,
    3: CouncelStage,
    4: SuspectStage,
    5: ResolutionStage,
};

export default function StagePage() {
    const router = useRouter();
    const { stage, roomId, round } = router.query;

    const [gameData, setGameData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [murderers, setMurderers] = useState([]);

    // Handle Firebase auth
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    // Subscribe to game data
    useEffect(() => {
        if (!roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            setGameData(data);
            checkGameOver(data);

            if (!data.killBox.some((kb) => kb.round === data.currentRound)) {
                assignBotTargets(data);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Determine current player and murderers
    useEffect(() => {
        if (!gameData || !currentUser) return;

        const player = gameData.players.find((p) => p.uid === currentUser.uid);
        setCurrentPlayer(player || null);

        if (player?.isMurderer) {
            const allMurderers = gameData.players.filter((p) => p.isMurderer);
            setMurderers(allMurderers);
        }
    }, [gameData, currentUser]);

    // Game over logic
    const checkGameOver = async (data) => {
        if (!data || !roomId) return;

        const alivePlayers = data.players.filter((player) => player.alive);
        const aliveMurderers = alivePlayers.filter((player) => player.isMurderer);
        const aliveVillagers = alivePlayers.filter((player) => !player.isMurderer);
        let winner = '';

        if (aliveMurderers.length > aliveVillagers.length) {
            winner = 'Murderers';
        } else if (alivePlayers.every((player) => !player.isMurderer)) {
            winner = 'Villagers';
        } else if (alivePlayers.length === 2) {
            winner = alivePlayers.some((p) => p.isMurderer) ? 'Murderers' : 'Villagers';
        }

        if (winner) {
            try {
                const gameRef = doc(db, 'games', roomId);
                await updateDoc(gameRef, { winner });
                alert(`Game Over! ${winner} have won.`);
                router.push(`/game/${roomId}/game-results`);
            } catch (error) {
                console.error('Error updating game winner:', error);
            }
        }
    };

    // Assign random targets for bot murderers
    const assignBotTargets = async (data) => {
        if (!data || !roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const { currentRound, players, killBox } = data;

        const roundExists = killBox.some((kb) => kb.round === currentRound);
        if (roundExists) return;

        const aliveVillagers = players.filter((p) => p.alive && !p.isMurderer);
        if (aliveVillagers.length === 0) return;

        const aliveBotMurderers = players.filter(
            (p) => p.alive && p.isMurderer && p.isBot
        );
        if (aliveBotMurderers.length === 0) return;

        const botTargets = {};
        aliveBotMurderers.forEach((bot) => {
            const randomTarget = aliveVillagers[Math.floor(Math.random() * aliveVillagers.length)];
            botTargets[bot.uid] = randomTarget.uid;
        });

        const updatedKillBox = [...killBox, { round: currentRound, targets: botTargets }];

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
            console.log('Bot targets assigned for round:', currentRound);
        } catch (error) {
            console.error('Error updating bot targets:', error);
        }
    };

    const StageComponent = stages[stage] || (() => <p>Invalid Stage</p>);

    return (
        <Page>
            <StageComponent
                stage={stage}
                roomId={roomId}
                round={round}
                currentUser={currentUser}
                currentPlayer={currentPlayer}
            />

            {gameData?.players?.length > 0 && (
                <PlayerList
                    players={gameData.players}
                    gameData={gameData}
                    currentPlayer={currentPlayer}
                    currentUser={currentUser}
                />
            )}

            <KillBox
                murderers={murderers}
                currentPlayer={currentPlayer}
                roomId={roomId}
                gameData={gameData}
            />

            {currentPlayer && <PlayerBox player={currentPlayer} />}
        </Page>
    );
}
