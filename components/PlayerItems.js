import React from 'react';

const PlayerItems = ({ currentPlayer, game }) => {
    if (!currentPlayer) return null;
    console.log("game", game)
    console.log("currentPlayer", currentPlayer)

    const items = currentPlayer.items || [];

    const useShield = () => {
        // Logic to use the shield item
        console.log("Shield used!");
    }


    return (
        <div className="mt-6 text-white bg-black bg-opacity-50 p-4 rounded-lg border border-yellow-700">
            <h2 className="text-base font-bold mb-3">🎒 Your Items</h2>

            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.slug}-${index}`}
                            className="flex items-center bg-gray-900 px-4 py-2 rounded text-xs gap-3"
                        >
                            <img
                                src={`/market/${item.slug}.png`}
                                alt={item.item}
                                className="w-10 h-10 object-contain rounded"
                            />
                            <span className="">{item.item}</span>
                            {game?.currentStage === 4 && item.slug === "shield" &&
                                <button onClick={() => useShield()} className={`bg-yellow-600 text-black px-2 py-1 ml-auto`}>Use</button>
                            }
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">You have no items right now.</p>
            )
            }
        </div >
    );
};

export default PlayerItems;

