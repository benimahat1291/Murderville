import React from 'react';

export default function PlayerBox({ player }) {
    if (!player) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4 border border-gray-700 bg-black bg-opacity-70 text-white rounded-xl shadow-lg">
            <h2 className="font-pixel text-lg text-center mb-4">🧍 Your Player Info</h2>

            <ul className="space-y-2 text-sm font-mono">
                <li><strong>🆔 Name:</strong> {player.name}</li>
                <li><strong>🎭 Character:</strong> {player.character || 'Unknown'}</li>
                <li>
                    <strong>💀 Alive:</strong>{' '}
                    <span className={player.alive ? 'text-green-400' : 'text-red-500'}>
                        {player.alive ? '🟢 Yes' : '🔴 No'}
                    </span>
                </li>
                <li><strong>💰 Gold:</strong> {player.gold ?? 0}</li>
                <li><strong>🧠 Bot:</strong> {player.isBot ? '🤖 Yes' : '🧑 Human'}</li>
                <li><strong>🧑‍✈️ Host:</strong> {player.isHost ? '✅ Yes' : '❌ No'}</li>
                <li>
                    <strong>🔪 Role:</strong>{' '}
                    {player.isMurderer ? (
                        <span className="text-red-400">🩸 Murderer</span>
                    ) : (
                        <span className="text-blue-300">🛡️ Villager</span>
                    )}
                </li>
            </ul>
        </div>
    );
}
