import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../utils/firebase';
import { getFirestore, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

const db = getFirestore(app);

export default function Lobby() {
    const router = useRouter();
    const { roomId } = router.query;

    const [players, setPlayers] = useState([]);
    const [player, setPlayer] = useState(null);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        if (!roomId) return;

        const auth = getAuth(app);
        return onAuthStateChanged(auth, async (user) => {
            if (!user) return router.push('/login');

            const playerInfo = {
                uid: user.uid,
                name: user.displayName || `Player-${user.uid.slice(-4)}`,
                isHost: false,
                isMurderer: null,
                character: null,
                gold: 0,
                items: [],
                alive: true,
                isBot: false,
            };

            setPlayer(playerInfo);

            const gameRef = doc(db, 'games', roomId);
            const unsub = onSnapshot(gameRef, async (snapshot) => {
                if (!snapshot.exists()) return;

                const game = snapshot.data();
                setPlayers(game.players);

                if (game.hostId === user.uid) setIsHost(true);

                const alreadyInGame = game.players.some(p => p.uid === user.uid);
                if (!alreadyInGame) {
                    const firstBotIndex = game.players.findIndex(p => p.isBot);
                    if (firstBotIndex !== -1) {
                        const updatedPlayers = [...game.players];
                        updatedPlayers[firstBotIndex] = playerInfo;
                        await updateDoc(gameRef, { players: updatedPlayers });
                    }
                }

                // 🌟 Automatically navigate all players when phase changes
                if (game.phase === 'started') {
                    router.push(`/game/${roomId}/roles`);
                }
            });

            return () => unsub();
        });
    }, [roomId, router]);

    const startGame = async () => {
        const villageCharacters = [
            "The Mayor", "The Doctor", "The Blacksmith", "The Innkeeper",
            "The Priest", "The Baker", "The Hunter", "The Fortune Teller",
            "The Drunkard", "The Tailor", "The Outcast", "The Stranger"
        ];

        const gameRef = doc(db, 'games', roomId);
        const snapshot = await getDoc(gameRef);
        const game = snapshot.data();

        // Shuffle characters
        const shuffledCharacters = [...villageCharacters].sort(() => Math.random() - 0.5);

        // Shuffle players to randomize murderer assignment
        const shuffledPlayers = [...game.players].sort(() => Math.random() - 0.5);

        // Select random murderers
        const murderers = shuffledPlayers.slice(0, game.numTraitors).map(p => p.uid);

        // Assign roles and characters
        const updatedPlayers = game.players.map((p, index) => ({
            ...p,
            character: shuffledCharacters[index] || 'Villager',
            isMurderer: murderers.includes(p.uid),
        }));

        await updateDoc(gameRef, {
            phase: 'started',
            players: updatedPlayers,
        });
    };


    return (
        <div className="p-6 min-h-screen flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold">Lobby - Room {roomId}</h1>
            <ol className="list-decimal space-y-1 text-lg">
                {players.map((p, index) => (
                    <li key={p.uid}>
                        {p.name} {p.isBot ? '(Bot)' : ''} {p.isHost ? '(Host)' : ''} {p.uid === player?.uid ? '(You)' : ''}
                    </li>
                ))}
            </ol>
            {isHost && (
                <button onClick={startGame} className="mt-4 bg-green-500 text-white px-6 py-2 rounded">
                    Start Game
                </button>
            )}
        </div>
    );
}
