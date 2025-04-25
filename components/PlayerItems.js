import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../utils/firebase";

const PlayerItems = ({ currentPlayer, game, stage, killedPlayer, setKilledPlayer }) => {
    const [selectingShieldTargetId, setSelectingShieldTargetId] = useState(null);
    const [usingPotionId, setUsingPotionId] = useState(null);
    const [usingTorchId, setUsingTorchId] = useState(null);
    const [torchReveal, setTorchReveal] = useState(null);
    if (!currentPlayer || !game) return null;

    const items = currentPlayer.items || [];
    const allPlayers = [currentPlayer, ...(game?.players?.filter(p => p.uid !== currentPlayer.uid) || [])];
    const handleTorchReveal = async (targetUid, itemIdToRemove) => {
        const target = game.players.find(p => p.uid === targetUid);
        if (!target) return;

        // First, handle the reveal logic
        setTorchReveal({
            character: target.character,
            isMurderer: target.isMurderer,
        });

        // Now handle the removal of the item (if provided)
        const updatedPlayers = game.players.map(player => {
            if (player.uid === targetUid) {
                return { ...player, isRevealed: true }; // Adding an example flag for reveal (optional)
            }

            if (player.uid === currentPlayer.uid) {
                const updatedItems = [...(player.items || [])];
                const indexToRemove = updatedItems.findIndex(item => item.id === itemIdToRemove);
                if (indexToRemove !== -1) updatedItems.splice(indexToRemove, 1); // Remove the item
                return { ...player, items: updatedItems };
            }

            return player;
        });

        // Update the game state with the new player data
        try {
            await updateDoc(doc(db, "games", game.roomId), {
                players: updatedPlayers,
            });

            // Reset any necessary state
            setUsingTorchId(null); // Reset the Torch ID (optional)
            setSelectingShieldTargetId(null); // Reset shield target (if needed)
        } catch (err) {
            console.error("Failed to update torch reveal and item removal:", err);
        }
    };

    const handleProtect = async (targetUid, itemIdToRemove) => {
        const updatedPlayers = game.players.map(player => {
            // ✅ If current player is protecting themselves
            if (player.uid === targetUid && player.uid === currentPlayer.uid) {
                const updatedItems = [...(player.items || [])];
                const indexToRemove = updatedItems.findIndex(item => item.id === itemIdToRemove);
                if (indexToRemove !== -1) updatedItems.splice(indexToRemove, 1);
                return { ...player, isProtected: true, items: updatedItems };
            }

            // ✅ If this is the target (not currentPlayer)
            if (player.uid === targetUid) {
                return { ...player, isProtected: true };
            }

            // ✅ If this is the current player (not the target)
            if (player.uid === currentPlayer.uid) {
                const updatedItems = [...(player.items || [])];
                const indexToRemove = updatedItems.findIndex(item => item.id === itemIdToRemove);
                if (indexToRemove !== -1) updatedItems.splice(indexToRemove, 1);
                return { ...player, items: updatedItems };
            }

            return player;
        });

        try {
            await updateDoc(doc(db, "games", game.roomId), {
                players: updatedPlayers,
            });

            setSelectingShieldTargetId(null);
        } catch (err) {
            console.error("Failed to update protection:", err);
        }
    };


    const handleRevive = async (itemId) => {
        const revivedPlayer = {
            ...killedPlayer,
            alive: true,
            isRevived: true,

        };

        const updatedPlayers = game.players.map(player => {
            if (player.uid === killedPlayer.uid) {
                return revivedPlayer;
            }

            if (player.uid === currentPlayer.uid) {
                const updatedItems = [...(player.items || [])];
                const indexToRemove = updatedItems.findIndex(i => i.id === itemId);
                if (indexToRemove !== -1) updatedItems.splice(indexToRemove, 1);
                return { ...player, items: updatedItems };
            }

            return player;
        });

        const updatedKillBox = game.killBox.map((kb, index) =>
            index === game.killBox.findIndex(kb => kb.round === game.currentRound)
                ? { ...kb, killed: revivedPlayer }
                : kb
        );

        try {
            await updateDoc(doc(db, "games", game.roomId), {
                players: updatedPlayers,
                killBox: updatedKillBox
            });

            setUsingPotionId(null);
            setKilledPlayer(revivedPlayer); // update local state for smoother UI transition
        } catch (err) {
            console.error("Failed to revive player:", err);
        }
    };


    console.log("playerItems", killedPlayer, stage, currentPlayer)

    return (
        <div className="mt-6 text-white bg-black bg-opacity-50 p-2 rounded-lg border border-yellow-700">

            {items.length > 0 ? (
                <div className="space-y-2">
                    <h2 className="text-base font-bold mb-3">🎒 Your Items</h2>

                    {items.map((item, index) => (
                        <div
                            key={item.id || `${item.slug}-${index}`}
                            className="flex flex-col bg-gray-900 px-4 py-2 rounded text-xs gap-2"
                        >

                            <div className="flex items-center gap-3">
                                <img
                                    src={`/market/${item.slug}.png`}
                                    alt={item.item}
                                    className="w-10 h-10 object-contain rounded"
                                />
                                <span>{item.item}</span>

                                {stage === "4" && item.slug === "shield" && (
                                    <button
                                        onClick={() => setSelectingShieldTargetId(item.id)}
                                        className="bg-yellow-600 text-black px-2 py-1 ml-auto rounded"
                                    >
                                        Use
                                    </button>
                                )}

                                {stage === "4" && item.slug === "torch" && (
                                    <button
                                        onClick={() => setUsingTorchId(item.id)}
                                        className="bg-yellow-600 text-black px-2 py-1 ml-auto rounded"
                                    >
                                        Use
                                    </button>
                                )}

                                {stage === "5" && item.slug === "potion" && killedPlayer && !killedPlayer.revived && (

                                    <button
                                        onClick={() => setUsingPotionId(item.id)}
                                        className="bg-green-600 text-black px-2 py-1 ml-auto rounded"
                                    >
                                        Use
                                    </button>
                                )}
                            </div>

                            {usingTorchId === item.id && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-gray-300 mb-1">Select a player to investigate:</p>
                                    <ul className="space-y-1 text-xs">
                                        {allPlayers
                                            .filter(player => player.alive && player.uid !== currentPlayer.uid)
                                            .map(player => (
                                                <li
                                                    key={player.uid}
                                                    className="flex justify-between items-center bg-zinc-800 p-2 rounded"
                                                >
                                                    <span>{player.character}</span>
                                                    <button
                                                        onClick={() => handleTorchReveal(player.uid, item.id)}
                                                        className="text-orange-300 underline hover:text-orange-500"
                                                    >
                                                        🔥 Reveal
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}


                            {selectingShieldTargetId === item.id && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-gray-300 mb-1">Select a player to protect:</p>
                                    <ul className="space-y-1 text-xs">
                                        {allPlayers
                                            .filter(player => player.alive)
                                            .map(player => (
                                                <li
                                                    key={player.uid}
                                                    className="flex justify-between items-center bg-zinc-800 p-2 rounded"
                                                >
                                                    <span>
                                                        {player.character} {player.uid === currentPlayer.uid && "(You)"}
                                                    </span>
                                                    <button
                                                        onClick={() => handleProtect(player.uid, item.id)}
                                                        className="text-green-300 underline hover:text-green-500"
                                                    >
                                                        🛡️ Protect
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}


                            {usingPotionId === item.id && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-gray-300 mb-1">
                                        Do you want to revive {killedPlayer.character}?
                                    </p>
                                    <button
                                        onClick={() => handleRevive(item.id)}
                                        className="text-blue-300 underline hover:text-blue-500 text-xs"
                                    >
                                        🧪 Revive
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-xs text-center italic">You Have No Items!</p>
            )}

            {torchReveal && (
                <div className="mt-3 text-[10px] text-orange-300 bg-zinc-800 p-2 rounded">
                    🔍 {torchReveal.character} is {torchReveal.isMurderer ? "a ❌ Murderer" : "✅ not a Murderer"}.
                </div>
            )}
        </div>
    );
};

export default PlayerItems;
