import React from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const KillBox = ({ murderers, gameData, roomId, currentPlayer }) => {
    const db = getFirestore();

    if (!gameData || !gameData.killBox || murderers.length === 0) return null;

    const latestRoundKillBoxIndex = gameData.killBox.findIndex(
        (kb) => kb.round === gameData.currentRound
    );
    if (latestRoundKillBoxIndex === -1) return null;

    const latestRoundKillBox = gameData.killBox[latestRoundKillBoxIndex];
    const targets = latestRoundKillBox?.targets || {};

    const handleSkipKill = async () => {
        if (!currentPlayer?.uid) return;

        const gameRef = doc(db, 'games', roomId);
        const updatedKillBox = gameData.killBox.map((kb, index) =>
            index === latestRoundKillBoxIndex
                ? { ...kb, targets: { ...kb.targets, [currentPlayer.uid]: 'skip' } }
                : kb
        );

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
            console.log(`${currentPlayer.uid} skipped the kill tonight.`);
        } catch (error) {
            console.error('Error updating skip kill:', error);
        }
    };

    return (
        <div className="w-full max-w-2xl mt-6 bg-red-900 bg-opacity-50 border border-red-600 text-white p-4 rounded-lg shadow-lg">
            <h2 className="font-pixel text-lg mb-4 text-center text-red-300">🩸 Murderer Targets</h2>

            <ul className="space-y-3 text-sm">
                {murderers.map((m) => {
                    const targetId = targets[m.uid];
                    const targetPlayer = gameData.players.find((p) => p.uid === targetId);

                    return (
                        <li key={m.uid} className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-bold">{m.name}</span>
                                <span className="italic text-gray-300">({m.character})</span>
                                {m.alive ? (
                                    <span title="Alive" className="text-green-400">🟢</span>
                                ) : (
                                    <span title="Dead" className="text-red-400">🔴</span>
                                )}
                            </div>

                            <div className="text-gray-300 pl-2 sm:pl-0 text-sm mt-1 sm:mt-0">
                                {targetId === 'skip' && (
                                    <span className="text-yellow-400">⏭️ Skipped</span>
                                )}
                                {targetPlayer && targetId !== 'skip' && (
                                    <span className="text-blue-300">
                                        🎯 {targetPlayer.name} <span className="italic text-xs">({targetPlayer.character})</span>
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {currentPlayer?.alive && currentPlayer?.isMurderer && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleSkipKill}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded shadow"
                    >
                        ⏭️ Skip the Kill Tonight
                    </button>
                </div>
            )}
        </div>
    );
};

export default KillBox;
