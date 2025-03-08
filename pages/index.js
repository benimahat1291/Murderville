import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

const db = getFirestore(app);

export default function Home() {
    const [user, setUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [numPlayers, setNumPlayers] = useState(12);
    const [numTraitors, setNumTraitors] = useState(2);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth(app);
        return onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/login');
            }
        });
    }, [router]);

    const handleLogout = async () => {
        await signOut(getAuth(app));
        router.push('/login');
    };

    const openCreateGameModal = () => setShowModal(true);

    const handleEnterLobby = async () => {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString();
        const gameRef = doc(db, 'games', roomId);

        const hostPlayer = {
            uid: user.uid,
            name: user.displayName || 'Player',
            isHost: true,
            isMurderer: null,
            character: null,
            gold: 0,
            items: [],
            alive: true,
            isBot: false,
        };

        const botPlayers = Array.from({ length: numPlayers - 1 }, (_, i) => ({
            uid: `bot-${i + 1}`,
            name: `Bot ${i + 1}`,
            isHost: false,
            isMurderer: null,
            character: null,
            gold: 0,
            items: [],
            alive: true,
            isBot: true,
        }));

        await setDoc(gameRef, {
            roomId,
            hostId: user.uid,
            createdAt: new Date().toISOString(),
            phase: 'lobby',
            currentRound: 0,
            currentStage: 0,
            roundHistory: [],
            numPlayers,
            numTraitors,
            players: [hostPlayer, ...botPlayers],
            councelResults: [],
            killBox: [],
            events: [],
            votingStarted: false,
            votingComplete: false,
        });

        router.push(`/lobby/${roomId}`);
    };

    const handleJoinGame = () => {
        const roomId = prompt('Enter Room ID:');
        if (roomId) router.push(`/lobby/${roomId}`);
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <h1 className="text-3xl font-bold">Welcome to Mafia Game</h1>
            <p className="text-lg">Hello, {user.displayName || 'Player'}!</p>
            <div className="space-x-4">
                <button onClick={openCreateGameModal} className="bg-green-500 text-white px-4 py-2 rounded">Create Game</button>
                <button onClick={handleJoinGame} className="bg-blue-500 text-white px-4 py-2 rounded">Join Game</button>
            </div>
            <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Logout</button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg space-y-4 w-80">
                        <h2 className="text-xl font-bold">Create Game Settings</h2>
                        <label>Number of Players</label>
                        <input type="number" value={numPlayers} onChange={(e) => setNumPlayers(+e.target.value)} className="w-full border px-2 py-1" min={5} max={12} />
                        <label>Number of Traitors</label>
                        <input type="number" value={numTraitors} onChange={(e) => setNumTraitors(+e.target.value)} className="w-full border px-2 py-1" min={1} max={Math.floor(numPlayers / 3)} />
                        <div className="flex justify-between">
                            <button onClick={() => setShowModal(false)} className="bg-gray-400 px-4 py-2 rounded">Cancel</button>
                            <button onClick={handleEnterLobby} className="bg-green-500 px-4 py-2 rounded">Enter Lobby</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
