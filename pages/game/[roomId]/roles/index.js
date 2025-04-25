import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    getFirestore,
    doc,
    updateDoc,
    onSnapshot,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../../utils/firebase';
import Page from '../../../../components/layout/Page'; // adjust path if needed

const db = getFirestore(app);

export default function RolesPage() {
    const router = useRouter();
    const { roomId } = router.query;
    const [game, setGame] = useState([]);
    const [players, setPlayers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isHost, setIsHost] = useState(false);


    function playerIsMurderer(currentUser, players) {
        const current = players.find((p) => p.uid === currentUser?.uid);
        return current?.isMurderer === true;
    }

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
        router.push(`/game/${roomId}/round/1/stage/1`);
    };

    useEffect(() => {
        if (game.phase?.startsWith('round')) {
            const phaseParts = game.phase.split('-');
            if (phaseParts.length === 4 && !isNaN(phaseParts[1]) && !isNaN(phaseParts[3])) {
                const [_, round, __, stage] = phaseParts;
                router.push(`/game/${roomId}/round/${round}/stage/${stage}`);
            }
        }
    }, [game.phase, roomId, router]);

    return (
        <Page>
            <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-xl text-white py-2 rounded-xl shadow-lg space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold font-pixel text-center">
                    Room {roomId}
                </h1>

                {/* Role Key */}
                <div className="bg-black bg-opacity-50 p-3 rounded-lg border border-gray-600 text-xs w-full max-w-sm">
                    <p className="font-bold mb-1 font-pixel text-center"></p>
                    <div className="flex justify-around text-center">
                        <div>
                            <div className="text-lg mb-2">🔪</div>
                            <div className="text-xs text-blue-300">Murderer</div>
                        </div>
                        <div>
                            <div className="text-lg mb-2">🛡️</div>
                            <div className="text-xs text-blue-300">Villager</div>
                        </div>
                    </div>
                </div>


                {/* Players List */}
                <ul className="list-disc space-y-3 pl-5 text-lg w-full">
                    {players.map((p) => {
                        const isCurrentUser = p.uid === currentUser?.uid;
                        const current = players.find((pl) => pl.uid === currentUser?.uid);
                        const currentIsMurderer = current?.isMurderer;
                        console.log("role", p)
                        let icon = '';

                        if (isCurrentUser) {
                            icon = currentIsMurderer ? '🔪' : '🛡️';
                        } else if (currentIsMurderer && p.isMurderer) {
                            icon = '🔪'; // Only murderers see each other
                        }

                        return (
                            <li key={p.uid} className="flex items-center gap-2 text-sm">
                                <span className={`font-bold ${isCurrentUser ? "text-yellow-300" : "text-white"} text-[10px]`}>{p.name}</span>
                                <span className='text-[7px]'>- {p.character}</span>
                                {icon && <span className="text-xl">{icon}</span>}
                            </li>
                        );
                    })}
                </ul>

                {playerIsMurderer(currentUser, players) && (
                    <div className="w-full max-w-xl bg-red-900 bg-opacity-30 text-white p-4 mt-6 rounded-lg">
                        <h2 className="font-pixel text-xs mb-2 text-red-200 ">You are a Murderer</h2>
                        <span className='text-[9px]'>Work with your cohort of village murderers to kill the villagers one by one. Win when Murderers outnumber the villagers </span>
                    </div>
                )}
            </div>

            {/* Host Start Button */}
            {isHost && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={startRoundOneStageOne}
                        className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded  text-lg font-bold"
                    >
                        Start Game
                    </button>
                </div>
            )}

            {/* Murderers-Only Box */}

        </Page>

    );
}
