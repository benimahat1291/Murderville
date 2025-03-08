import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../../utils/firebase"; // Firestore db
import { initializeGame } from "../../utils/events/handyouredealt"; // Game initialization function

export default function HandYoureDealt({ gameId, currentUser, isHost, currentRound }) {
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [eventData, setEventData] = useState(null);

    useEffect(() => {
        if (!gameId || !currentRound) return;

        const fetchOrInitializeEvent = async () => {
            console.log("🔄 Checking event in Firestore...");
            const gameRef = doc(db, "games", gameId);
            const gameSnap = await getDoc(gameRef);

            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                const events = Array.isArray(gameData.events) ? gameData.events : Object.values(gameData.events || {});
                const event = events.find(e => e.round === currentRound);

                if (!event) {
                    console.log("🚀 Event does not exist, initializing...");
                    await initializeGame(gameId, currentRound);
                } else {
                    setEventData(event);
                }
            }
        };

        fetchOrInitializeEvent();
    }, [gameId, currentRound]);

    useEffect(() => {
        if (!gameId || !currentRound) return;

        console.log("🔄 Listening for event players in Firestore...");
        const gameRef = doc(db, "games", gameId);

        const unsubscribe = onSnapshot(gameRef, (gameSnap) => {
            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                const events = Array.isArray(gameData.events) ? gameData.events : Object.values(gameData.events || {});
                const event = events.find(e => e.round === currentRound);

                if (event) {
                    setAlivePlayers([...event.players]);
                    setEventData(event);

                    const foundPlayer = event.players.find(p => p.uid === currentUser.uid);
                    setCurrentPlayer(foundPlayer || null);

                    if (event.players.every(p => p.choice !== null) && event.gameState !== "completed") {
                        finishTheGame(gameId, currentRound, event.players);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, currentRound]);

    const startGame = async () => {
        console.log("🚀 Fetching game data...");
        const gameRef = doc(db, "games", gameId);

        try {
            const gameSnap = await getDoc(gameRef);

            if (gameSnap.exists()) {
                let gameData = gameSnap.data();
                let events = [...gameData.events]; // Clone events array

                // Find the correct event index for this round
                let eventIndex = events.findIndex(e => e.round === currentRound);
                if (eventIndex === -1) {
                    console.log("❌ No matching event found for this round.");
                    return;
                }

                // ✅ Update only the `gameState` field in the correct event object
                await updateDoc(gameRef, { [`events.${eventIndex}.gameState`]: "inProgress" });

                console.log("✅ Game state updated to inProgress");
            } else {
                console.log("❌ No game found with this ID!");
            }
        } catch (error) {
            console.error("❌ Error updating game state:", error);
        }
    };



    const handleDecision = async (decision) => {
        if (!gameId || !currentRound || !currentPlayer) return;

        console.log(`📌 ${currentPlayer.name} chose: ${decision ? "Play" : "Fold"}`);

        const gameRef = doc(db, "games", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameRef);
                if (!gameSnap.exists()) return;

                const gameData = gameSnap.data();
                const eventIndex = gameData.events.findIndex(e => e.round === currentRound);
                if (eventIndex === -1) return;

                const updatedPlayers = gameData.events[eventIndex].players.map(player =>
                    player.uid === currentPlayer.uid ? { ...player, choice: decision } : player
                );

                transaction.update(gameRef, {
                    [`events.${eventIndex}.players`]: updatedPlayers
                });
            });

            console.log(`✅ Updated choice for ${currentPlayer.name}`);
        } catch (error) {
            console.error("❌ Error updating choice:", error);
        }
    };

    const finishTheGame = async (gameId, currentRound, players) => {
        console.log("🔄 Finishing the game...");

        const gameRef = doc(db, "games", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameRef);
                if (!gameSnap.exists()) return;

                const gameData = gameSnap.data();
                const eventIndex = gameData.events.findIndex(e => e.round === currentRound);
                if (eventIndex === -1) return;

                const event = gameData.events[eventIndex];

                const didnotplay = players.filter(p => p.choice === false).map(p => p.uid);
                const playingPlayers = players.filter(p => p.choice === true);

                const sortedPlayers = [...playingPlayers].sort((a, b) => {
                    return (b.cards[0] + b.cards[1]) - (a.cards[0] + a.cards[1]);
                });

                const half = Math.ceil(sortedPlayers.length / 2);
                const winners = sortedPlayers.slice(0, half);
                const losers = sortedPlayers.slice(half);

                transaction.update(gameRef, {
                    [`events.${eventIndex}.winners`]: winners.map(p => p.uid),
                    [`events.${eventIndex}.losers`]: losers.map(p => p.uid),
                    [`events.${eventIndex}.didnotplay`]: didnotplay,
                    [`events.${eventIndex}.gameState`]: "completed",
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

            {!eventData && <p>Loading event...</p>}

            {eventData?.gameState === "waiting" && (
                <div>
                    {isHost ? (
                        <button className="btn border-black border" onClick={startGame}>
                            Start Game
                        </button>
                    ) : (
                        <span>Waiting for host to start the game...</span>
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
