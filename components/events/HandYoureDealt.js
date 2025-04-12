import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { initializeGame } from "../../utils/events/handyouredealt";

export default function HandYoureDealt({ gameId, currentUser, isHost, currentRound }) {
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [eventData, setEventData] = useState(null);

    console.log(isHost, currentUser, currentRound);

    const roundKey = String(currentRound);

    useEffect(() => {
        if (!gameId || !roundKey) return;

        const fetchOrInitializeEvent = async () => {
            console.log("🔄 Checking event in Firestore...");
            const gameRef = doc(db, "games", gameId);
            const gameSnap = await getDoc(gameRef);

            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                const event = gameData.events?.[roundKey];

                if (!event) {
                    console.log("🚀 Event does not exist, initializing...");
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

        const unsubscribe = onSnapshot(gameRef, (gameSnap) => {
            if (!gameSnap.exists()) return;

            const gameData = gameSnap.data();
            const event = gameData.events?.[roundKey];

            if (event && Array.isArray(event.players)) {
                setAlivePlayers(event.players);
                setEventData(event);

                const found = event.players.find(p => p.uid === currentUser.uid);
                setCurrentPlayer(found || null);

                if (event.players.every(p => p.choice !== null) && event.gameState !== "completed") {
                    finishTheGame(gameId, roundKey, event.players);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, roundKey]);

    const startGame = async () => {
        console.log("🚀 Starting game...");
        const gameRef = doc(db, "games", gameId);

        try {
            const gameSnap = await getDoc(gameRef);

            if (!gameSnap.exists()) {
                console.log("❌ No game found with this ID!");
                return;
            }

            const gameData = gameSnap.data();
            const event = gameData.events?.[roundKey];

            if (!event) {
                console.log("❌ No matching event found for this round.");
                return;
            }

            await updateDoc(gameRef, {
                [`events.${roundKey}.gameState`]: "inProgress"
            });

            console.log("✅ Game state updated to inProgress");
        } catch (error) {
            console.error("❌ Error updating game state:", error);
        }
    };

    const handleDecision = async (decision) => {
        if (!gameId || !roundKey || !currentPlayer) return;

        const gameRef = doc(db, "games", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameRef);
                if (!gameSnap.exists()) return;

                const gameData = gameSnap.data();
                const event = gameData.events?.[roundKey];
                if (!event) return;

                const updatedPlayers = event.players.map(player =>
                    player.uid === currentPlayer.uid ? { ...player, choice: decision } : player
                );

                transaction.update(gameRef, {
                    [`events.${roundKey}.players`]: updatedPlayers
                });
            });

            console.log(`✅ Updated choice for ${currentPlayer.name}`);
        } catch (error) {
            console.error("❌ Error updating choice:", error);
        }
    };

    const finishTheGame = async (gameId, roundKey, players) => {
        const gameRef = doc(db, "games", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameRef);
                if (!gameSnap.exists()) return;

                const gameData = gameSnap.data();
                const event = gameData.events?.[roundKey];
                if (!event) return;

                const didnotplay = players.filter(p => p.choice === false).map(p => p.uid);
                const playingPlayers = players.filter(p => p.choice === true);

                const sortedPlayers = [...playingPlayers].sort((a, b) => {
                    return (b.cards[0] + b.cards[1]) - (a.cards[0] + a.cards[1]);
                });

                const half = Math.ceil(sortedPlayers.length / 2);
                const winners = sortedPlayers.slice(0, half);
                const losers = sortedPlayers.slice(half);

                transaction.update(gameRef, {
                    [`events.${roundKey}.winners`]: winners.map(p => p.uid),
                    [`events.${roundKey}.losers`]: losers.map(p => p.uid),
                    [`events.${roundKey}.didnotplay`]: didnotplay,
                    [`events.${roundKey}.gameState`]: "completed"
                });
            });

            console.log("✅ Game completed, results saved.");
        } catch (error) {
            console.error("❌ Error updating game results:", error);
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded shadow">
            <h2 className="text-xl font-bold mb-2">The Hand You’re Dealt</h2>
            <div className="mb-4 p-4 rounded border border-blue-300 bg-blue-50 text-blue-900">
                <h3 className="text-lg font-bold mb-2">🎴 How This Game Works</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                    <li>Each player is dealt <strong>two random cards</strong>.</li>
                    <li>You must choose whether to <span className="font-semibold text-green-700">Play</span> or <span className="font-semibold text-red-700">Fold</span>.</li>
                    <li>To Play you must offer  <span className="font-semibold text-red-700">- 2 coins</span>, Win = <span className="font-semibold text-win-700">+ 2 Coins</span>.</li>

                    <li>Once all players have chosen, their card totals are compared.</li>
                    <li><strong>The top half</strong> of players who played are marked as <span className="font-semibold text-green-700">Winners</span>.</li>
                    <li><strong>The bottom half</strong> are <span className="font-semibold text-red-700">Losers</span>.</li>
                    <li>Players who folded are noted separately as having <em>sat out</em>.</li>
                </ul>
            </div>
            {!eventData && <p>Loading event...</p>}

            {eventData?.gameState === "waiting" && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
                    {isHost ? (
                        <>
                            <p className="mb-2 font-semibold">You are the host. Start the round when ready:</p>
                            <button
                                onClick={startGame}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                ▶️ Start Game
                            </button>
                        </>
                    ) : (
                        <p className="italic text-gray-700">Waiting for the host to start the game...</p>
                    )}
                </div>
            )}


            {eventData?.gameState === "inProgress" && currentPlayer && (
                <>
                    <p>You are playing as <strong>{currentPlayer.name}</strong>.</p>
                    <p>Your cards: {currentPlayer.cards?.join(", ")}</p>

                    <button onClick={() => handleDecision(true)} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Play</button>
                    <button onClick={() => handleDecision(false)} className="bg-red-500 text-white px-4 py-2 rounded">Fold</button>
                </>
            )}

            {eventData?.gameState === "inProgress" && (
                <>
                    <h3 className="mt-4 text-lg font-bold">Other Players</h3>
                    <ul className="mt-4">
                        {alivePlayers?.map(player => (
                            <li key={player.uid} className="mt-2 flex justify-between items-center w-[200px]">
                                <strong>{player.name}</strong> -
                                <span>
                                    {player.choice === null ? "❓" : player.choice ? "✅" : "❌"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {eventData?.gameState === "completed" && eventData && (
                <>
                    <h3>Winners: {eventData.winners.join(", ")}</h3>
                    <h3>Losers: {eventData.losers.join(", ")}</h3>
                    <h3>Did Not Play: {eventData.didnotplay.join(", ")}</h3>
                </>
            )}
        </div>
    );
}