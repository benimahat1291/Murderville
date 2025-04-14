import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { initializeGame } from "../../utils/events/handyouredealt";

export default function HandYoureDealt({ gameId, currentUser, isHost, currentRound }) {
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [eventData, setEventData] = useState(null);

    console.log(eventData, "eventData");

    const roundKey = String(currentRound);

    useEffect(() => {
        if (!gameId || !roundKey) return;

        const fetchOrInitializeEvent = async () => {
            const gameRef = doc(db, "games", gameId);
            const gameSnap = await getDoc(gameRef);
            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                const event = gameData.events?.[roundKey];
                if (!event) {
                    await initializeGame(gameId, currentRound);
                } else {
                    setEventData(event);
                }
            }
        };

        fetchOrInitializeEvent();
    }, [gameId, roundKey]);

    useEffect(() => {
        if (!gameId || !roundKey) return;

        const gameRef = doc(db, "games", gameId);
        let finished = false;

        const unsubscribe = onSnapshot(gameRef, (snap) => {
            if (!snap.exists()) return;
            const gameData = snap.data();
            const event = gameData.events?.[roundKey];

            if (event && Array.isArray(event.players)) {
                setAlivePlayers(event.players);
                setEventData(event);
                const found = event.players.find((p) => p.uid === currentUser.uid);
                setCurrentPlayer(found || null);

                if (
                    event.players.every(p => p.choice !== null) &&
                    event.gameState === "inProgress" &&
                    !finished
                ) {
                    finished = true;
                    calculateResults(gameId, roundKey, event.players);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, roundKey, currentUser?.uid]);

    const startGame = async () => {
        const gameRef = doc(db, "games", gameId);
        const gameSnap = await getDoc(gameRef);
        if (!gameSnap.exists()) return;
        const gameData = gameSnap.data();
        const event = gameData.events?.[roundKey];
        if (!event) return;
        await updateDoc(gameRef, { [`events.${roundKey}.gameState`]: "inProgress" });
    };

    const handleDecision = async (decision) => {
        if (!gameId || !roundKey || !currentPlayer) return;
        const gameRef = doc(db, "games", gameId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            if (!snap.exists()) return;
            const gameData = snap.data();
            const event = gameData.events?.[roundKey];
            if (!event) return;

            const updatedPlayers = event.players.map((p) =>
                p.uid === currentPlayer.uid ? { ...p, choice: decision } : p
            );

            transaction.update(gameRef, {
                [`events.${roundKey}.players`]: updatedPlayers,
            });
        });
    };

    const calculateResults = async (gameId, roundKey, players) => {
        const gameRef = doc(db, "games", gameId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            if (!snap.exists()) return;

            const gameData = snap.data();
            const event = gameData.events?.[roundKey];
            if (!event) return;

            const didNotPlay = players.filter((p) => p.choice === false).map((p) => p.uid);
            const playing = players.filter((p) => p.choice === true);

            const sorted = [...playing].sort((a, b) =>
                b.cards[0] + b.cards[1] - (a.cards[0] + a.cards[1])
            );

            const half = Math.ceil(sorted.length / 2);
            const winners = sorted.slice(0, half);
            const losers = sorted.slice(half);

            transaction.update(gameRef, {
                [`events.${roundKey}.winners`]: winners.map(p => p.uid),
                [`events.${roundKey}.losers`]: losers.map(p => p.uid),
                [`events.${roundKey}.didnotplay`]: didNotPlay,
                [`events.${roundKey}.gameState`]: "results-ready",
            });
        });
    };

    const finishTheGame = async () => {
        const gameRef = doc(db, "games", gameId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            if (!snap.exists()) return;

            const gameData = snap.data();
            const event = gameData.events?.[roundKey];
            if (!event) return;

            const updatedPlayers = gameData.players.map((p) => {
                if (event.winners.includes(p.uid)) return { ...p, gold: (p.gold || 0) + 2 };
                if (event.losers.includes(p.uid)) return { ...p, gold: (p.gold || 0) - 2 };
                return p;
            });

            transaction.update(gameRef, {
                [`events.${roundKey}.gameState`]: "completed",
                players: updatedPlayers,
            });
        });
    };

    return (
        <div
            className="flex items-center justify-center "
        >
            <div className="w-full max-w-3xl bg-red-500 bg-opacity-20 rounded-lg  p-4 text-white font-pixel">
                <h2 className="text-sm text-center text-red-500 mb-6"><span className="text-xl">🃏</span> The Hand You’re Dealt</h2>
                <img
                    src={`/games/hand-your-dealt.webp`}
                    alt={"Hand-Youre-Dealt"}
                    className="rounded-lg w-full h-40 object-cover border-b border-zinc-800"
                />

                <div className="mb-6 p-4  bg-black bg-opacity-50 rounded-xl mt-2  text-blue-100 ">
                    <h3 className="text-sm font-bold mb-2">📜 How It Works</h3>
                    <ul className="list-disc pl-6 text-[8px] space-y-1">
                        <li>You get 2 random cards.(A=1,j=11,Q=12,K=13)</li>
                        <li>Choose to <span className="text-green-400">Play</span> or <span className="text-red-400">Fold</span>.</li>
                        <li>To win The sum of your cards must be in the top half of players who play</li>
                        <li>win = <span className="text-green-400">+4 coins</span></li>
                        <li>play = <span className="text-red-400">-2 coins</span></li>
                    </ul>
                </div>

                {!eventData && <p className="text-center">🕒 Loading event...</p>}

                {eventData?.gameState === "waiting" && (
                    <div className="p-4 text-center bg-yellow-100 text-yellow-800 rounded-lg font-mono">
                        {isHost ? (
                            <>
                                <p className="mb-2 font-semibold">You’re the host. Ready to begin?</p>
                                <button onClick={startGame} className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700">
                                    ▶️ Start Round
                                </button>
                            </>
                        ) : (
                            <p>⏳ Waiting for the host to start the round...</p>
                        )}
                    </div>
                )}

                {console.log("eventData?.gameState", currentPlayer)}

                {eventData?.gameState === "inProgress" && currentPlayer && (
                    <>
                        <div className="mt-6 text-center text-sm">
                            <p className="mb-1 text-xs text-gray-300">You are dealt..</p>
                            <div className="flex justify-center my-4">
                                {currentPlayer?.cards && currentPlayer?.cards.map((card, i) => (
                                    <img key={i} src={card.image} alt={`Card ${card.rank} of ${card.suit}`} className="w-1/2 h-auto mr-2" />
                                ))}
                            </div>
                            {currentPlayer.gold > 1 && (
                                <button onClick={() => handleDecision(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2">
                                    ✅ Play
                                </button>
                            )}
                            <button onClick={() => handleDecision(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                                ❌ Fold
                            </button>
                        </div>
                        {/* player dicision list */}
                        <div className="mt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                {alivePlayers
                                    .slice()
                                    .sort((a, b) => {
                                        const val = (x) => x.choice === true ? 0 : x.choice === false ? 1 : 2;
                                        return val(a) - val(b);
                                    })
                                    .map((p) => (
                                        <div
                                            key={p.uid}
                                            className="relative w-full  overflow-hidden border border-zinc-700 shadow-md"
                                        >
                                            <img
                                                src={`/characters/${p.characterSlug || 'default'}.webp`}
                                                alt={p.character}
                                                className="w-full h-full object-cover"
                                            />

                                            <div className="absolute h-full inset-0 bg-black bg-opacity-50 flex flex-col justify-between items-center text-white text-xs font-mono p-2">
                                                <p className="font-bold text-center text-[8px]">{p.character}</p>
                                                <p>
                                                    <span className="text-2xl text-[orange]">
                                                        {p.choice === null ? '?' : p.choice ? '✅' : '❌'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                    ))}
                            </div>
                        </div>

                    </>
                )}

                {eventData?.gameState === "results-ready" && isHost && (
                    <div className="text-center mt-6">
                        <button
                            onClick={finishTheGame}
                            className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded  text-lg font-bold"

                        >
                            Reveal Results
                        </button>
                    </div>
                )}
                {/* Result Section */}
                {eventData?.gameState === "completed" && <div className="grid grid-cols-3">
                    {alivePlayers
                        .slice()
                        .sort((a, b) => {
                            const getPriority = (p) => {
                                if (eventData?.winners.includes(p.uid)) return 0;
                                if (eventData?.losers.includes(p.uid)) return 1;
                                if (eventData?.didnotplay.includes(p.uid)) return 2;
                                return 3;
                            };
                            return getPriority(a) - getPriority(b);
                        })
                        .map((p) => (
                            <div
                                key={p.uid}
                                className="relative w-full  flex flex-col justify-between overflow-hidden border border-zinc-700 shadow-md h-full"
                            >
                                <img
                                    src={`/characters/${p.characterSlug || 'default'}.webp`}
                                    alt={p.character}
                                    className="w-full object-cover"
                                />
                                <div className="absolute h-full inset-0 bg-black bg-opacity-50 flex flex-col justify-between items-center text-white text-xs font-mono p-2">
                                    <p className="font-bold text-center text-[8px]">{p.character}</p>
                                    <p>
                                        {eventData?.winners.includes(p.uid)
                                            ? <span className="text-green-500 flex flex-col">✅ Winner <span className="text-[gold]">+2 gold</span></span>
                                            : eventData?.losers.includes(p.uid)
                                                ? <span className="red-green-500 flex flex-col">❌ Loser <span className="text-red-500">-2 gold</span></span>
                                                : eventData?.didnotplay.includes(p.uid)
                                                    ? <span className="red-green-500 flex flex-col">Folded </span>
                                                    : '❓ Undecided'}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>}

            </div>
        </div>
    );
}
