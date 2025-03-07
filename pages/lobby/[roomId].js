import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../utils/firebase';

let socket;

export default function Lobby() {
    const router = useRouter();
    const { roomId } = router.query;

    const [players, setPlayers] = useState([]);
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        if (!roomId) return;

        socket = io({ path: '/api/socket' });

        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const playerInfo = {
                    uid: user.uid,
                    name: user.displayName || `Player-${user.uid.slice(-4)}`,
                    isHost: false,
                    role: null,
                    character: null,
                    gold: 0,
                    items: [],
                    isBot: false,
                    role: null,
                    alive: true,

                };
                setPlayer(playerInfo);

                socket.emit('joinRoom', roomId, playerInfo);
            } else {
                router.push('/login');
            }
        });

        socket.on('updatePlayers', (allPlayers) => {
            setPlayers(allPlayers);
        });

        return () => {
            socket.disconnect();
            unsubscribe();
        };
    }, [roomId, router]);

    const startGame = async () => {
        await fetch('/api/startgame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId }),
        });
        router.push(`/game/${roomId}`);
    };

    console.log(players);

    return (
        <div className="p-6 min-h-screen flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold">Lobby - Room {roomId}</h1>

            <ol className="list-decimal list-inside space-y-1 text-lg">
                {players.map((p, index) => (
                    <li key={p.uid}>
                        {p.name} {p.isBot ? '(Bot)' : ''}
                        {index === 0 ? ' (Host)' : ''}
                        {p.uid === player?.uid ? ' (You)' : ''}
                    </li>
                ))}
            </ol>

            {players[0]?.uid === player?.uid && (
                <button
                    onClick={startGame}
                    className="mt-4 px-6 py-2 bg-green-500 text-white rounded shadow"
                >
                    Ready to assign roles!
                </button>
            )}
        </div>
    );
}
