import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../utils/firebase";

const PlayerItems = ({ currentPlayer, game }) => {
    const [selectingShieldTarget, setSelectingShieldTarget] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState(null);

    if (!currentPlayer || !game) return null;

    const items = currentPlayer.items || [];
    const allPlayers = [currentPlayer, ...(game?.players?.filter(p => p.uid !== currentPlayer.uid) || [])];

    const handleProtect = async (targetUid) => {
        // Update the protected player
        const updatedPlayers = game.players.map(player => {
            if (player.uid === targetUid) {
                return { ...player, isProtected: true };
            }

            // Remove the shield from the current player
            if (player.uid === currentPlayer.uid) {
                const updatedItems = [...(player.items || [])];
                const shieldIndex = updatedItems.findIndex(item => item.slug === "shield");
                if (shieldIndex !== -1) updatedItems.splice(shieldIndex, 1); // remove first shield

                return { ...player, items: updatedItems };
            }

            return player;
        });

        try {
            await updateDoc(doc(db, "games", game.roomId), {
                players: updatedPlayers,
            });

            setSelectingShieldTarget(false);
            setSelectedTarget(null);
        } catch (err) {
            console.error("Failed to update protection:", err);
        }
    };


    console.log("Current Player Items:", items, "All Players:", allPlayers, "Game:", game, "Current Player:", currentPlayer);

    return (
        <div className="mt-6 text-white bg-black bg-opacity-50 p-4 rounded-lg border border-yellow-700">
            <h2 className="text-base font-bold mb-3">🎒 Your Items</h2>

            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.slug}-${index}`}
                            className="flex flex-col bg-gray-900 px-4 py-2 rounded text-xs gap-2"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={`/market/${item.slug}.png`}
                                    alt={item.item}
                                    className="w-10 h-10 object-contain rounded"
                                />
                                <span className="">{item.item}</span>
                                {game?.currentStage === 4 && item.slug === "shield" && (
                                    <button
                                        onClick={() => setSelectingShieldTarget(prev => !prev)}
                                        className="bg-yellow-600 text-black px-2 py-1 ml-auto rounded"
                                    >
                                        Use
                                    </button>
                                )}
                            </div>

                            {/* Dropdown for selecting a player */}
                            {selectingShieldTarget && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-gray-300 mb-1">Select a player to protect:</p>
                                    <ul className="space-y-1 text-xs">
                                        {allPlayers && allPlayers
                                            .filter(player => player.alive)
                                            .map(player => (
                                                <li key={player.uid} className="flex justify-between items-center bg-zinc-800 p-2 rounded">
                                                    <span>
                                                        {player.character} {player.uid === currentPlayer.uid && "(You)"}
                                                    </span>
                                                    <button
                                                        onClick={() => handleProtect(player.uid)}
                                                        className="text-green-300 underline hover:text-green-500"
                                                    >
                                                        🛡️ Protect
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">You have no items right now.</p>
            )}
        </div>
    );
};

export default PlayerItems;
