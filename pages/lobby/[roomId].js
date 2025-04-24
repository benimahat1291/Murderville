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

    const startGame = async (randomize = true) => {
        const villageCharacters = [
            {
                name: 'The Mayor',
                slug: 'mayor',
                ability: 'Has the ability to buy an extra vote in exchange for gold.',
                items: []
            },
            {
                name: 'The Doctor',
                slug: 'doctor',
                ability: 'Starts with two potions. Can buy potions for 5 gold',
                items: [
                    {
                        item: 'Potion',
                        slug: 'potion',
                        description: "Heals a player that has been murdered! (player starts with 0 gold and no items).",
                    },
                    {
                        item: 'Potion',
                        slug: 'potion',
                        description: "Heals a player that has been murdered! (player starts with 0 gold and no items).",
                    }
                ]

            },
            {
                name: 'The Blacksmith',
                slug: 'blacksmith',
                ability: 'Starts with a shield  Can buy shields for 3 gold.',
                items: []

            },
            {
                name: 'The Innkeeper',
                slug: 'innkeeper',
                ability: 'Can block one player’s Vote at council',
                items: []

            },
            {
                name: 'The Priest',
                slug: 'priest',
                ability: 'Can learn if a dead player was good or evil.',
                items: []

            },
            {
                name: 'The Baker',
                slug: 'baker',
                ability: 'If killed, the town skips the next night phase.',
                items: []

            },
            {
                name: 'The Hunter',
                slug: 'hunter',
                ability: 'If killed, can take another player down with them.',
                items: []

            },
            {
                name: 'The Gaurd',
                slug: 'gaurd',
                ability: 'Can protect one player from murder each night.',
                items: []

            },
            {
                name: 'The Fortune Teller',
                slug: 'fortune-teller',
                ability: 'Can peek at and choose between the next two events.',
                items: []

            },
            {
                name: 'The Drunkard',
                slug: 'drunkard',
                ability: 'No ability, but appears as a random good role to the fortune teller.',
                items: []

            },
            {
                name: 'The Sherif',
                slug: 'sherif',
                ability: 'Can check one player every even round to see if they’re a murderer.',
                items: []

            },
            {
                name: 'The Outcast',
                slug: 'outcast',
                ability: 'Wins if voted out. Loses if villagers win. Looks suspicious but isn’t evil.',
                items: []

            },
            {
                name: 'The Stranger',
                slug: 'stranger',
                ability: 'Gains the ability of the player they voted for last.',
                items: []

            },
        ];


        const requiredCharacters = [
            villageCharacters.find(c => c.slug === 'mayor'),
            villageCharacters.find(c => c.slug === 'doctor'),
            villageCharacters.find(c => c.slug === 'sherif'),
            villageCharacters.find(c => c.slug === 'gaurd'),
            villageCharacters.find(c => c.slug === 'blacksmith'),
            villageCharacters.find(c => c.slug === 'priest'),


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

        let murderers = [];

        if (randomize) {
            murderers = shuffledPlayers.slice(0, game.numTraitors).map((p) => p.uid);
        } else {
            const hostPlayer = shuffledPlayers.find((p) => p.uid === game.hostId);
            const remainingPlayers = shuffledPlayers.filter((p) => p.uid !== game.hostId);
            murderers = [
                hostPlayer?.uid,
                ...remainingPlayers.slice(0, game.numTraitors - 1).map((p) => p.uid),
            ].filter(Boolean);
        }
        // Assign characters to players
        const updatedPlayers = shuffledPlayers.map((p, index) => {
            const character = selectedCharacters[index];
            return {
                ...p,
                character: character ? character.name : 'Villager',
                characterSlug: character ? character.slug : 'villager',
                ability: character ? character.ability : "No abliity yet!",
                items: character ? character.items : [],
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
                            onClick={() => startGame(false)}
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
