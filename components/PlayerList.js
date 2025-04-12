import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export default function PlayerList({ players, currentPlayer, currentUser, gameData }) {
    const currentRound = gameData.currentRound;

    console.log(players)

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
        <div className="w-full max-w-5xl mx-auto mt-6 text-white">
            <h2 className="text-lg font-pixel mb-4">🧑 Players</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((p) => {
                    const isAlive = p.alive;
                    const isTargetable = currentPlayer?.isMurderer && !p.isMurderer && isAlive;
                    console.log(p)
                    return (
                        <div
                            key={p.uid}
                            className={`flex flex-col justify-between h-full bg-black bg-opacity-70 border border-gray-700 p-4 rounded-lg shadow-lg`}
                        >
                            {/* Placeholder image or role-based character art */}
                            <img
                                src={`/characters/${p.characterSlug}.webp`}
                                alt={`${p.character}`}
                                className="w-full h-32 object-cover rounded mb-4 border"
                            />
                            <div className="space-y-1 text-sm">
                                <p><span className="font-bold">Character:</span> {p.character}</p>
                                <p><span className="font-bold">Name:</span> <span className="italic text-gray-300">{p.name}</span></p>
                                <p>
                                    <span className="font-bold">Status:</span>{' '}
                                    {isAlive ? (
                                        <span className="text-green-400">🟢 Alive</span>
                                    ) : (
                                        <span className="text-red-400">🔴 Dead</span>
                                    )}
                                </p>
                            </div>

                            {isTargetable && (
                                <button
                                    onClick={() => handleTargetSelection(p.uid)}
                                    className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded shadow"
                                >
                                    🎯 Target
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
