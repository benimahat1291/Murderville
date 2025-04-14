import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../utils/firebase';
import {
    getFirestore,
    doc,
    updateDoc,
    onSnapshot,
    getDoc,
} from 'firebase/firestore';
import Page from '../../components/layout/Page'; // adjust path if needed

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
                gold: 3,
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

                const alreadyInGame = game.players.some((p) => p.uid === user.uid);
                if (!alreadyInGame) {
                    const firstBotIndex = game.players.findIndex((p) => p.isBot);
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
            { name: 'The Mayor', slug: 'mayor' },
            { name: 'The Doctor', slug: 'doctor' },
            { name: 'The Blacksmith', slug: 'blacksmith' },
            { name: 'The Innkeeper', slug: 'innkeeper' },
            { name: 'The Priest', slug: 'priest' },
            { name: 'The Baker', slug: 'baker' },
            { name: 'The Hunter', slug: 'hunter' },
            { name: 'The Gaurd', slug: 'gaurd' },
            { name: 'The Fortune Teller', slug: 'fortune-teller' },
            { name: 'The Drunkard', slug: 'drunkard' },
            { name: 'The Sherif', slug: 'sherif' },
            { name: 'The Outcast', slug: 'outcast' },
            { name: 'The Stranger', slug: 'stranger' },
        ];

        const requiredCharacters = [
            { name: 'The Mayor', slug: 'mayor' },
            { name: 'The Doctor', slug: 'doctor' },
            { name: 'The Sherif', slug: 'sherif' },
            { name: 'The Gaurd', slug: 'Gaurd' },
            { name: 'The Fortune Teller', slug: 'fortune-teller' },
        ];

        const gameRef = doc(db, 'games', roomId);
        const snapshot = await getDoc(gameRef);
        const game = snapshot.data();

        const shuffledPlayers = [...game.players].sort(() => Math.random() - 0.5);

        const remainingCharacters = villageCharacters.filter(
            (char) => !requiredCharacters.some((req) => req.slug === char.slug)
        );

        // Shuffle remaining characters
        const shuffledRemainingCharacters = remainingCharacters.sort(() => Math.random() - 0.5);

        // Combine required + remaining characters (just enough for the number of players)
        const selectedCharacters = [
            ...requiredCharacters,
            ...shuffledRemainingCharacters.slice(0, game.players.length - requiredCharacters.length),
        ];

        const murderers = shuffledPlayers
            .slice(0, game.numTraitors)
            .map((p) => p.uid);

        // Assign characters to players
        const updatedPlayers = shuffledPlayers.map((p, index) => {
            const character = selectedCharacters[index];
            return {
                ...p,
                character: character ? character.name : 'Villager',
                characterSlug: character ? character.slug : 'villager',
                isMurderer: murderers.includes(p.uid),
            };
        });

        await updateDoc(gameRef, {
            phase: 'started',
            players: updatedPlayers,
        });
    };


    return (
        <Page>
            <div>
                <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-xl  text-white p-6 rounded-xl shadow-lg space-y-4">
                    <h1 className="text-xl sm:text-3xl font-bold font-pixel text-center">
                        Lobby - Room {roomId}
                    </h1>
                    <div className='bg-[rgba(0,0,0,0.5)] p-4 rounded-xl'>
                        <div className="w-full ">
                            <ol className="list-decimal space-y-2 text-sm pl-5">
                                {players.map((p) => (
                                    <li key={p.uid}>
                                        {p.name}{' '}
                                        <span className="text-yellow-300">
                                            {p.isBot ? '(Bot)' : ''}
                                            {p.isHost ? ' (Host)' : ''}
                                            {p.uid === player?.uid ? ' (You)' : ''}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>


                    {isHost && (
                        <button
                            onClick={startGame}
                            className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded text-lg font-bold"
                        >
                            Start Game
                        </button>
                    )}
                </div>
            </div>

        </Page>
    );
}
