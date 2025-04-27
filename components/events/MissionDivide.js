import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { initializeMissionDivide } from "../../utils/events/missionDivide";

export default function MissionDivide({ gameId, currentUser, isHost, currentRound }) {
    const [eventData, setEventData] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const roundKey = String(currentRound);

    useEffect(() => {
        if (!gameId || !roundKey) return;

        const fetchEvent = async () => {
            const gameRef = doc(db, "games", gameId);
            const snap = await getDoc(gameRef);
            const data = snap.data();
            const event = data.events?.[roundKey];
            if (!event) await initializeMissionDivide(gameId, currentRound);
            else setEventData(event);
        };

        fetchEvent();
    }, [gameId, roundKey]);

    useEffect(() => {
        if (!gameId || !roundKey) return;

        const gameRef = doc(db, "games", gameId);
        return onSnapshot(gameRef, (snap) => {
            if (!snap.exists()) return;
            const game = snap.data();
            const event = game.events?.[roundKey];
            if (!event) return;

            setEventData(event);
            const allPlayers = [...event.groupA, ...event.groupB];
            const player = allPlayers.find(p => p.uid === currentUser.uid);
            setCurrentPlayer(player);

            const allDecided = allPlayers.every(p => p.decision !== null);
            if (allDecided && event.gameState === "inProgress") {
                calculateResults(gameId, roundKey, event);
            }
        });
    }, [gameId, roundKey, currentUser?.uid]);

    const startGame = async () => {
        await updateDoc(doc(db, "games", gameId), {
            [`events.${roundKey}.gameState`]: "inProgress",
        });
    };

    const makeDecision = async (decision) => {
        if (!currentPlayer) return;
        const gameRef = doc(db, "games", gameId);

        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            const event = snap.data().events?.[roundKey];

            const updateGroup = (group) =>
                group.map(p => p.uid === currentPlayer.uid ? { ...p, decision } : p);

            transaction.update(gameRef, {
                [`events.${roundKey}.groupA`]: updateGroup(event.groupA),
                [`events.${roundKey}.groupB`]: updateGroup(event.groupB),
            });
        });
    };

    const calculateResults = async (gameId, roundKey, event) => {
        const gameRef = doc(db, "games", gameId);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            const gameData = snap.data();

            const sabotageInGroup = (group) => group.some(p => p.decision === "sabotage");
            const winners = [];
            const losers = [];

            if (!sabotageInGroup(event.groupA)) winners.push(...event.groupA);
            else losers.push(...event.groupA);

            if (!sabotageInGroup(event.groupB)) winners.push(...event.groupB);
            else losers.push(...event.groupB);

            transaction.update(gameRef, {
                [`events.${roundKey}.winners`]: winners.map(p => p.uid),
                [`events.${roundKey}.losers`]: losers.map(p => p.uid),
                [`events.${roundKey}.gameState`]: "results-ready",
            });
        });
    };

    const revealResults = async () => {
        const gameRef = doc(db, "games", gameId);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(gameRef);
            const game = snap.data();
            const event = game.events?.[roundKey];

            const updatedPlayers = game.players.map(p => {
                if (event.winners.includes(p.uid)) return { ...p, gold: (p.gold || 0) + 2 };
                if (event.losers.includes(p.uid)) return { ...p };
                return p;
            });

            transaction.update(gameRef, {
                [`events.${roundKey}.gameState`]: "completed",
                players: updatedPlayers,
            });
        });
    };

    return (
        <div className="flex justify-center text-white font-pixel">
            <div className="w-full max-w-3xl bg-blue-900 bg-opacity-20 rounded-lg p-2">
                <h2 className="text-sm text-center text-blue-400 mb-6">
                    <span className="text-xl">🕵️‍♂️</span> Mission Divide
                </h2>

                <h3 className="font-bold mb-2 text-blue-200"><i onClick={() => setShowInfo(!showInfo)} className="hn hn-info-circle mr-2 text-xl"></i>How it works?</h3>

                {showInfo && <div className="mb-4 p-4 bg-black bg-opacity-50 rounded-xl text-xs space-y-1">
                    <ul className="list-disc pl-4">
                        <li>Players are split into 2 secret mission groups</li>
                        <li>Choose to <span className="text-green-400">Pass</span> or <span className="text-red-400">Sabotage</span></li>
                        <li>If all in your group Pass → <span className="text-green-400">Everyone Wins</span></li>
                        <li>If anyone Sabotages → <span className="text-red-400">Everyone in group loses</span></li>
                        <li>Winners: <span className="text-yellow-300">+2 coins</span>, Losers: <span className="text-red-300">-2 coins</span></li>
                    </ul>
                </div>}

                {/* Waiting State */}
                {eventData?.gameState === "waiting" && (
                    <div className="text-center bg-yellow-200 text-yellow-800 p-4 rounded-lg">
                        {isHost ? (
                            <>
                                <p className="mb-2 font-bold">Ready to launch the mission?</p>
                                <button onClick={startGame} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded">
                                    🚀 Start Mission
                                </button>
                            </>
                        ) : (
                            <p>🕒 Waiting for host to start the mission...</p>
                        )}
                    </div>
                )}

                {/* Decision UI */}
                {eventData?.gameState === "inProgress" && currentPlayer && (
                    <div className="text-center mt-6">
                        <p className="mb-2 text-xs">Will you Sabotage this mission or help your team complete the task?</p>
                        {currentPlayer.decision === null ? (
                            <>
                                <button
                                    onClick={() => makeDecision("pass")}
                                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white mr-2 text-xs"
                                >
                                    ✅ Help
                                </button>
                                <button
                                    onClick={() => makeDecision("sabotage")}
                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-xs"
                                >
                                    ❌ Sabotage
                                </button>
                            </>
                        ) : (
                            <p className="text-green-200 font-bold">✅ Decision Made</p>
                        )}
                    </div>
                )}

                {/* Team Display */}
                {(eventData?.groupA || eventData?.groupB) && eventData?.gameState !== "completed" && (
                    <div className="mt-6">
                        <h4 className="text-sm font-bold mb-2 text-blue-300">🧑‍🤝‍🧑 Mission Teams</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[["A", eventData.groupA], ["B", eventData.groupB]].map(([label, group]) => (
                                <div key={label} className="bg-black bg-opacity-30 p-2 rounded-md border border-blue-500">
                                    <h5 className="text-blue-300 mb-2 text-xs">Group {label}</h5>
                                    {group.map((p) => (
                                        <div key={p.uid} className="text-white text-[10px] flex justify-between items-center border-t border-zinc-700 py-1">
                                            <span>{p.character}</span>
                                            <span className="text-lg">
                                                {isHost ? (
                                                    p.decision === null ? "❓" : p.decision === "pass" ? "✅" : "❌"
                                                ) : (
                                                    ""
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reveal Results */}
                {eventData?.gameState === "results-ready" && isHost && (
                    <div className="text-center mt-6">
                        <button
                            onClick={revealResults}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded text-lg font-bold"
                        >
                            🎯 Reveal Results
                        </button>
                    </div>
                )}

                {/* Final Result Section */}
                {eventData?.gameState === "completed" && (
                    <div className="mt-6 grid grid-cols-2 gap-2 text-center">
                        {[...eventData.groupA, ...eventData.groupB].map((p) => {
                            const isWinner = eventData.winners.includes(p.uid);
                            const isLoser = eventData.losers.includes(p.uid);
                            return (
                                <div
                                    key={p.uid}
                                    className="border p-1 flex flex-col f border-zinc-600 rounded-md bg-opacity-40 bg-black"
                                >
                                    <p className="text-[10px] font-bold">{p.character}</p>
                                    {isWinner && <span className="text-green-400 flex flex-col text-[10px]">
                                        <span>
                                            ✅ Success</span>
                                        <span className="text-xs text-yellow-300">
                                            +2 gold
                                        </span>
                                    </span>}
                                    {isLoser &&
                                        <span className="text-red-400 flex flex-col text-[10px]">
                                            <span >
                                                ❌ Failed
                                            </span>
                                            <span className="text-xs text-red-300">

                                            </span>

                                        </span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
