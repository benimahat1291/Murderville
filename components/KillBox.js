import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const KillBox = ({ murderers, gameData, roomId, currentPlayer }) => {
    const db = getFirestore();
    const [showInfo, setShowInfo] = useState(false)

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
        <div className='bg-black w-full h-full p-2 rounded'>
            <strong className='text-white text-sm'>Kill Box <i onClick={() => setShowInfo(!showInfo)} className='hn hn-info-circle'></i></strong>
            {showInfo && <div>
                <span className='text-white text-[8px] line-clamp-6'>Plan our your kill. All Targets must be locked in my the end of stage 4. if there if a tie, a kill will be chosen at random between the tied kills. </span>
            </div>}
            <div className="mt-2 grid grid-cols-2 gap-4">

                {murderers.map((m) => {
                    const targetId = targets[m.uid];
                    const targetPlayer = gameData.players.find((p) => p.uid === targetId);

                    let actionText = "❓ Undecided";
                    if (targetId === 'skip') {
                        actionText = "⏭️ Skipped";
                    } else if (targetPlayer) {
                        actionText = <span className='flex items-center'><span className='text-2xl mr-2'>🎯</span>{targetPlayer.character}</span>;
                    }

                    return (
                        <div
                            key={m.uid}
                            className="relative w-full overflow-hidden border border-red-700 shadow-md"
                        >
                            <img
                                src={`/characters/${m.characterSlug || 'default'}.webp`}
                                alt={m.character}
                                className="w-full h-20 object-cover"
                            />

                            <div className="absolute h-full inset-0 bg-black bg-opacity-60 flex flex-col justify-between items-center text-white text-xs font-mono p-2">
                                <div className="text-center text-[8px] font-bold">
                                    <p className='text-[10px]'>{m.character} <span className="italic text-gray-300">{m.name}</span></p>

                                    <p>{m.alive ? '🟢 Alive' : '🔴 Dead'}</p>
                                </div>

                                <div className="text-center text-yellow-300 text-[10px] font-bold">
                                    {actionText}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>


    );
};

export default KillBox;
