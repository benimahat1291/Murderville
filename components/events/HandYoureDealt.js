import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { initializeGame } from "../../utils/events/handyouredealt";

export default function HandYoureDealt({ gameId, currentUser, isHost, currentRound }) {
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [eventData, setEventData] = useState(null);

    const roundKey = String(currentRound);

    // Fetch or initialize the event
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

    // Realtime updates and results check
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

    // Host starts the round
    const startGame = async () => {
        const gameRef = doc(db, "games", gameId);
        const gameSnap = await getDoc(gameRef);
        if (!gameSnap.exists()) return;

        const gameData = gameSnap.data();
        const event = gameData.events?.[roundKey];
        if (!event) return;

        await updateDoc(gameRef, {
            [`events.${roundKey}.gameState`]: "inProgress",
        });
    };

    // Player decision handler
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

    // Results calculation
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

            const sorted = [...playing].sort((a, b) => {
                return b.cards[0] + b.cards[1] - (a.cards[0] + a.cards[1]);
            });

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

    // Final payout by host
    const finishTheGame = async (gameId, roundKey) => {
        const gameRef = doc(db, "games", gameId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            if (!snap.exists()) return;

            const gameData = snap.data();
            const event = gameData.events?.[roundKey];
            if (!event) return;

            const updatedPlayers = gameData.players.map((p) => {
                if (event.winners.includes(p.uid)) {
                    return { ...p, gold: (p.gold || 0) + 2 };
                } else if (event.losers.includes(p.uid)) {
                    return { ...p, gold: (p.gold || 0) - 2 };
                }
                return p;
            });

            transaction.update(gameRef, {
                [`events.${roundKey}.gameState`]: "completed",
                players: updatedPlayers,
            });
        });
    };

    return (
        <div className=" bg-black bg-opacity-70 text-white rounded-lg shadow-lg w-full max-w-3xl mx-auto font-mono">
            <h2 className="font-pixel text-xl mb-4 text-center">🃏 The Hand You’re Dealt</h2>

            <div className="mb-6 p-4 rounded border border-blue-500 bg-blue-900 bg-opacity-30 text-blue-100">
                <h3 className="text-lg font-bold mb-2">🎴 How It Works</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>You get 2 random cards.</li>
                    <li>Choose to <span className="text-green-400">Play</span> (-2 coins) or <span className="text-red-400">Fold</span>.</li>
                    <li>Top half of players who played = <span className="text-green-400">+2 coins</span></li>
                    <li>Bottom half lose = <span className="text-red-400">-2 coins</span></li>
                    <li>Players who fold don’t win or lose anything.</li>
                </ul>
            </div>

            {!eventData && <p className="text-center">Loading event...</p>}

            {eventData?.gameState === "waiting" && (
                <div className="p-4 bg-yellow-200 text-yellow-800 rounded">
                    {isHost ? (
                        <>
                            <p className="mb-2 font-semibold">You’re the host. Start the round:</p>
                            <button
                                onClick={startGame}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                ▶️ Start Game
                            </button>
                        </>
                    ) : (
                        <p>Waiting for the host to start the game...</p>
                    )}
                </div>
            )}

            {eventData?.gameState === "inProgress" && currentPlayer && (
                <>
                    <div className="mt-4">
                        <p className="mb-2 font-semibold">🎭 You are <strong>{currentPlayer.name}</strong></p>
                        <p className="mb-2">🃏 Your cards: <strong>{currentPlayer.cards?.join(", ")}</strong></p>

                        {currentPlayer.gold > 1 && (
                            <button
                                onClick={() => handleDecision(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2"
                            >
                                ✅ Play
                            </button>
                        )}
                        <button
                            onClick={() => handleDecision(false)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            ❌ Fold
                        </button>
                    </div>

                    <div className="mt-6">
                        <h3 className="font-bold mb-2">Other Players</h3>
                        <ul className="space-y-1 text-sm">
                            {alivePlayers.map((p) => (
                                <li key={p.uid} className="flex justify-between w-56">
                                    <span>{p.name}</span>
                                    <span>{p.choice === null ? '❓' : p.choice ? '✅' : '❌'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {eventData?.gameState === "results-ready" && isHost && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => finishTheGame(gameId, roundKey)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
                    >
                        ✅ Finish & Distribute Coins
                    </button>
                </div>
            )}

            {eventData?.gameState === "completed" && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold mb-2">🏁 Round Results</h3>
                    <p>🏆 Winners: {eventData.winners.join(", ")}</p>
                    <p>💀 Losers: {eventData.losers.join(", ")}</p>
                    <p>🪑 Sat Out: {eventData.didnotplay.join(", ")}</p>
                </div>
            )}
        </div>
    );
}
