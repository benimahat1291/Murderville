import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export default function PlayerList({ players, currentPlayer, currentUser, gameData }) {
    const currentRound = gameData.currentRound;

    console.log("PlayerList -> currentUSEr", currentPlayer);

    const handleTargetSelection = async (targetUid) => {
        if (!gameData || !currentUser) return;

        const gameRef = doc(db, 'games', gameData.roomId);

        // Check if a killBox entry exists for this round
        const existingKillBox = gameData.killBox.find(kb => kb.round === currentRound);

        let updatedKillBox;

        if (existingKillBox) {
            // Update existing round entry
            updatedKillBox = gameData.killBox.map(kb =>
                kb.round === currentRound
                    ? { ...kb, targets: { ...kb.targets, [currentUser.uid]: targetUid } }
                    : kb
            );
        } else {
            // Create new entry for the current round
            updatedKillBox = [
                ...gameData.killBox,
                { round: currentRound, targets: { [currentUser.uid]: targetUid } }
            ];
        }

        try {
            await updateDoc(gameRef, { killBox: updatedKillBox });
            console.log("Target selection updated in Firestore");
        } catch (error) {
            console.error("Error updating target:", error);
        }
    };

    return (
        <ul className="list-disc space-y-2 text-lg ml-8">
            {players.map((p) => (
                <li key={p.uid}>
                    {p.name} - {p.character}

                    {p.alive ? (
                        <span className="font-bold ml-2 text-green-500">A</span>
                    ) : (
                        <span className="font-bold ml-2 text-red-500">D</span>
                    )}



                    {/* Show Target Button only for Murderers & Only for Non-Murderer Players */}
                    {currentPlayer?.isMurderer && !p.isMurderer && p.alive && (
                        <button
                            onClick={() => handleTargetSelection(p.uid)}
                            className="ml-4 bg-red-100  text-sm text-red-500  px-2 py-1 rounded"
                        >
                            Target
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}
