import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export default function PlayerList({ players, currentPlayer, currentUser, gameData }) {
    const currentRound = gameData.currentRound;

    const handleTargetSelection = async (targetUid) => {
        if (!gameData || !currentUser) return;

        const gameRef = doc(db, 'games', gameData.roomId);
        const existingKillBox = gameData.killBox.find((kb) => kb.round === currentRound);

        let updatedKillBox;

        if (existingKillBox) {
            updatedKillBox = gameData.killBox.map((kb) =>
                kb.round === currentRound
                    ? { ...kb, targets: { ...kb.targets, [currentUser.uid]: targetUid } }
                    : kb
            );
        } else {
            updatedKillBox = [
                ...gameData.killBox,
                { round: currentRound, targets: { [currentUser.uid]: targetUid } },
            ];
        }

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
        } catch (error) {
            console.error("Error updating target:", error);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 md:px-0 max-w-6xl mx-auto mt-6 text-white">
            <div className="grid grid-cols-3 ">
                {players.map((p) => {
                    const isAlive = p.alive;
                    const isTargetable = currentPlayer?.isMurderer && !p.isMurderer && isAlive;

                    return (
                        <div
                            key={p.uid}
                            className="relative w-full overflow-hidden border border-zinc-700 shadow-md"
                        >
                            <img
                                src={`/characters/${p.characterSlug || 'default'}.webp`}
                                alt={p.character}
                                onError={(e) => e.currentTarget.src = '/characters/default.webp'}
                                className="w-full h-full object-cover"
                            />

                            <div className={`absolute h-full inset-0 bg-black ${isAlive ? "bg-opacity-50 text-white" : "bg-opacity-75 text-gray-500"}  flex flex-col justify-between   text-xs font-mono p-2`}>
                                <div className="font-bold">
                                    <p className='text-xs'>{p.character}</p>
                                    <p className="italic  ">{p.name}</p>
                                </div>
                                <p className={isAlive ? 'text-green-400' : 'text-red-400'}>
                                    {isAlive ?
                                        isTargetable ?
                                            <button
                                                onClick={() => handleTargetSelection(p.uid)}
                                                className=" bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-md transition mt-1"
                                            >
                                                🎯 Target
                                            </button>
                                            :
                                            <span className=" hover:bg-red-700 text-green-500 text-[10px] font-bold px-2 py-1 rounded shadow-md transition mt-1">
                                                🟢 Alive

                                            </span>
                                        :
                                        <span className=" hover:bg-red-700 text-red-500 text-[10px] font-bold px-2 py-1 rounded shadow-md transition mt-1">
                                            🔴 Dead
                                        </span>
                                    }

                                </p>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

}
