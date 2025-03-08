import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../../utils/firebase';

const db = getFirestore(app);

export default function RolesPage() {
    const router = useRouter();
    const { roomId } = router.query;
    const [game, setGame] = useState([]);
    const [players, setPlayers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });

        return () => unsubAuth();
    }, [router]);

    useEffect(() => {
        if (!roomId || !currentUser) return;

        const gameRef = doc(db, 'games', roomId);
        const unsub = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) {
                router.push('/');
                return;
            }

            const gameData = snapshot.data();
            setGame(gameData);
            setPlayers(gameData.players);

            // Determine if current user is the host
            if (gameData.hostId === currentUser.uid) {
                setIsHost(true);
            }
        });

        return () => unsub();
    }, [roomId, currentUser, router]);

    const startRoundOneStageOne = async () => {
        const gameRef = doc(db, 'games', roomId);
        await updateDoc(gameRef, {
            phase: 'round-1-stage-1',
            currentRound: 1,
            currentStage: 1,
        });

        // The onSnapshot listener will automatically detect the change and route all players
        router.push(`/game/${roomId}/round/1/stage/1`);
    };

    // Automatically route to the next stage if phase changes
    useEffect(() => {
        if (game.phase?.startsWith('round')) {
            const phaseParts = game.phase.split('-');

            // Ensure there are exactly 3 parts: ["round", roundNumber, "stage", stageNumber]
            if (phaseParts.length === 4 && !isNaN(phaseParts[1]) && !isNaN(phaseParts[3])) {
                const [_, round, __, stage] = phaseParts;
                router.push(`/game/${roomId}/round/${round}/stage/${stage}`);
            } else {
                console.error("Invalid phase format:", game.phase);
            }
        }
    }, [game.phase, roomId, router]);

    return (
        <div className="p-6 min-h-screen flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold">Game Started - Room {roomId}</h1>

            <ul className="list-disc space-y-2 text-lg">
                {players.map((p) => (
                    <li key={p.uid}>
                        {p.name} - {p.character}
                        {p.uid === currentUser?.uid && (
                            <span className="font-bold text-red-500">
                                {p.isMurderer ? ' (You are a Murderer)' : ' (You are a Villager)'}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {isHost && (
                <button
                    onClick={startRoundOneStageOne}
                    className="mt-4 bg-green-500 text-white px-6 py-2 rounded shadow"
                >
                    Start Game - Round 1 Stage 1
                </button>
            )}
        </div>
    );
}
