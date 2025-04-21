import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../utils/firebase";

const ITEMS = [
    {
        name: "Shield",
        price: 5,
        slug: "shield",
        description: "Blocks one murder attempt. Good for one night"
    },
    {
        name: "Potion",
        price: 10,
        slug: "potion",
        description: "Revive yourself or any player that has been killed tonight"
    },
    {
        name: "Torch",
        price: 5,
        slug: "torch",
        description: "Find out if any one player is traitor or not"
    },
    {
        name: "Revival",
        price: 10,
        slug: "revival",
        description: "An alive Player can revive any dead player. Revived player will starts with all their old supplies"
    }
];

export default function VillageMarket({ game, currentPlayer, }) {
    const [message, setMessage] = useState("");
    const playerGold = currentPlayer?.gold || 0;

    const handlePurchase = async (item) => {
        if (playerGold < item.price) {
            setMessage(`❌ Not enough gold to buy ${item.name}`);
            return;
        }

        const newItem = {
            id: crypto.randomUUID(), // ✅ Unique identifier
            item: item.name,
            slug: item.slug,
            description: item.description
        };

        const updatedPlayers = game.players.map((p) => {
            if (p.uid !== currentPlayer.uid) return p;

            return {
                ...p,
                gold: p.gold - item.price,
                items: [...(p.items || []), newItem],
            };
        });

        try {
            const gameRef = doc(db, "games", game.roomId);
            await updateDoc(gameRef, {
                players: updatedPlayers,
            });

            setMessage(`✅ You bought a ${item.name}!`);
        } catch (err) {
            console.error("Purchase failed:", err);
            setMessage("❌ Failed to complete purchase.");
        }
    };

    return (
        <div className="mt-4 text-white bg-black bg-opacity-50 p-4 rounded-lg border border-yellow-700">
            <h2 className="text-base font-bold mb-2">🏪 Village Market</h2>
            <p className="mb-4 text-sm">
                You have <strong>{playerGold}</strong> gold.
            </p>

            <div className="space-y-3">
                {ITEMS.map((item) => (
                    <div
                        key={item.slug}
                        className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded text-xs"
                    >
                        <div className="flex items-center gap-3 relative group cursor-pointer">
                            <img
                                src={`/market/${item.slug}.png`}
                                alt={item.name}
                                className="w-10 h-10 object-contain rounded"
                            />
                            <span>
                                {item.name} — <strong>{item.price} gold</strong>
                            </span>

                            {/* Tooltip */}
                            <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex bg-black bg-opacity-90 border border-yellow-500 text-white text-[10px] p-2 rounded w-60 shadow-lg">
                                {item.description}
                            </div>
                        </div>

                        <button
                            className="bg-yellow-600 hover:bg-yellow-400 text-black font-semibold py-1 px-4 rounded disabled:opacity-40"
                            onClick={() => handlePurchase(item)}
                            disabled={playerGold < item.price}
                        >
                            Buy
                        </button>
                    </div>
                ))}
            </div>

            {message && <p className="mt-4 text-sm text-yellow-300">{message}</p>}
        </div>
    );
}
