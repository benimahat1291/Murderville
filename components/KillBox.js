import React from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const KillBox = ({ murderers, gameData, roomId, currentPlayer }) => {
    const db = getFirestore();

    if (!gameData || !gameData.killBox || murderers.length === 0) return null;

    // Get the latest round's targets
    const latestRoundKillBoxIndex = gameData.killBox.findIndex(kb => kb.round === gameData.currentRound);
    if (latestRoundKillBoxIndex === -1) return null;

    const latestRoundKillBox = gameData.killBox[latestRoundKillBoxIndex];
    const targets = latestRoundKillBox ? latestRoundKillBox.targets : {};

    // Function to handle "Skip the Kill Tonight"
    const handleSkipKill = async () => {
        if (!currentPlayer || !currentPlayer.uid) return;

        const gameRef = doc(db, 'games', roomId);

        // Update the killBox to set the current player's target as "skip"
        const updatedKillBox = gameData.killBox.map((kb, index) =>
            index === latestRoundKillBoxIndex ? { ...kb, targets: { ...kb.targets, [currentPlayer.uid]: "skip" } } : kb
        );

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
            console.log(`${currentPlayer.uid} skipped the kill tonight.`);
        } catch (error) {
            console.error("Error updating skip kill:", error);
        }
    };

    return (
        <div>
            {murderers.length > 0 && (
                <div className="p-4 mt-4 text-black rounded-lg">
                    <h2 className="text-xl font-bold">Murderer Allies & Targets</h2>
                    <ul className="mt-2">
                        {murderers.map(m => {
                            const targetId = targets[m.uid]; // Get the murderer's assigned target
                            const targetPlayer = gameData.players.find(p => p.uid === targetId); // Find target details

                            return (
                                <li key={m.uid}>
                                    {m.name} - {m.character}

                                    {m.alive ? (
                                        <span className="font-bold ml-2 text-green-500">A</span>
                                    ) : (
                                        <span className="font-bold ml-2 text-red-500">D</span>
                                    )}
                                    {targetId === "skip" ? <span>  → SKIP</span> :
                                        <span>   </span>}
                                    {/* Show assigned target if exists */}
                                    {targetPlayer && (
                                        <span className="ml-4 text-gray-600">

                                            → Target: {targetPlayer.name} ({targetPlayer.character})
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Show 'Skip the Kill Tonight' button only for the current player if they are an alive murderer */}
                    {currentPlayer?.alive && currentPlayer?.isMurderer && (
                        <button
                            onClick={handleSkipKill}
                            className="mt-4 bg-gray-400 text-white px-4 py-2 rounded"
                        >
                            Skip the Kill Tonight
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default KillBox;
