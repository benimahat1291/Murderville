import React from 'react';

export default function PlayerBox({ player }) {
    if (!player) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-6 px-4 py-6 border border-yellow-400 rounded-2xl bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white">
            <h2 className="font-pixel text-sm text-yellow-300 text-center mb-4"><span className='text-xs text-gray-300'>You are: </span>{player.character}</h2>


            <div className="relative w-full h-48 mt-6 rounded-lg overflow-hidden border border-zinc-700 shadow">
                <img
                    src={`/characters/${player.characterSlug || 'default'}.webp`}
                    alt={player.character}
                    onError={(e) => e.currentTarget.src = '/characters/default.webp'}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-white text-sm font-mono p-4 space-y-2">
                    <div className='bg-black p-2 absolute bottom-0 right-0'>
                        <div className='bg-black'>
                            <span className="font-bold text-gray-300">💀 Alive:</span>{' '}
                            <span className={player.alive ? 'text-green-400' : 'text-red-500'}>
                                {player.alive ? '🟢 Yes' : '🔴 No'}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-yellow-300">💰 Gold:</span>{' '}
                            <span>{player.gold ?? 0}</span>
                        </div>
                        {player?.isHost && (
                            <div>
                                <span className="font-bold text-green-400">🧑‍✈️ Host:</span>{' '}
                                ✅ Yes
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-red-400">🔪 Role:</span>{' '}
                            {player.isMurderer ? (
                                <span className="text-red-400 font-bold">🩸 Murderer</span>
                            ) : (
                                <span className="text-blue-300 font-bold">🛡️ Villager</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
