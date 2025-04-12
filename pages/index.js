import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import Page from '../components/layout/Page';

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
            gold: 3,
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
            gold: 3,
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
        <Page>
            <div className="flex items-center justify-center min-h-screen ">
                <div className="w-full max-w-md bg-black bg-opacity-70 text-white p-6 rounded-xl shadow-lg space-y-4">
                    <h1 className=" text-xl sm:text-3xl font-bold text-center">Welcome to MurderVile</h1>
                    <p className="text-sm text-center">Hello, {user.displayName || 'Player'}!</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={openCreateGameModal} className="bg-green-500 text-white px-4 py-2 text-sm rounded"><span className='text-xl'>Create</span> Game</button>
                        <button onClick={handleJoinGame} className="bg-blue-500 text-white px-4 py-2 text-sm rounded"><span className='text-xl'>Join</span> Game</button>
                    </div>
                    <button onClick={handleLogout} className="w-full bg-red-500 text-black px-4 py-2 rounded">Logout</button>

                    {showModal && (
                        <div className="fixed inset-0 bg-black text-base  flex justify-center items-center z-50">
                            <div className=" p-6 rounded shadow-lg space-y-4 w-80">
                                <h2 className="text-xl mb-4 font-bold"> Game Settings</h2>
                                <div>
                                    <label className='text-sm'>Number of Players</label>
                                    <input
                                        type="number"
                                        value={numPlayers}
                                        onChange={(e) => setNumPlayers(+e.target.value)}
                                        className="w-full border px-2 py-1 mt-1 text-black"
                                        min={5}
                                        max={12}
                                    />
                                </div>

                                <div className='mt=6'>
                                    <label className='text-sm  mt-6'>Number of Traitors</label>
                                    <input
                                        type="number"
                                        value={numTraitors}
                                        onChange={(e) => setNumTraitors(+e.target.value)}
                                        className="w-full border px-2 py-1 mt-1 text-black"
                                        min={1}
                                        max={Math.floor(numPlayers / 3)}
                                    />
                                </div>

                                <div className="flex justify-between">
                                    <button onClick={() => setShowModal(false)} className="text-xs bg-gray-400 px-2 py-1 rounded">Cancel</button>
                                    <button onClick={handleEnterLobby} className="text-xs bg-green-500 px-4 py-2 rounded">Enter Lobby</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Page>
    );

}
