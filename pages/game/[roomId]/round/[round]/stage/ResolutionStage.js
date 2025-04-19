import useGameData from '../../../../../../hooks/useGameData';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

export default function ResolutionStage({ roomId, round, stage }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();
    const db = getFirestore();

    const [killedPlayer, setKilledPlayer] = useState(null);

    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);
            }
        }
    }, [game.currentRound, game.currentStage, router]);

    useEffect(() => {
        if (!game.killBox || !players) return;

        const roundKillBoxIndex = game.killBox.findIndex(kb => kb.round === game.currentRound);
        if (roundKillBoxIndex === -1) return;

        const roundKillBox = game.killBox[roundKillBoxIndex];

        if (roundKillBox.killed) {
            setKilledPlayer(roundKillBox.killed);
            return;
        }

        if (!roundKillBox.targets) return;

        const aliveMurderers = players.filter(player => player.isMurderer && player.alive).map(p => p.uid);

        const targetCounts = {};
        Object.entries(roundKillBox.targets).forEach(([murdererUid, targetUid]) => {
            if (aliveMurderers.includes(murdererUid)) {
                targetCounts[targetUid] = (targetCounts[targetUid] || 0) + 1;
            }
        });

        if (Object.keys(targetCounts).length === 0) return;

        const maxVotes = Math.max(...Object.values(targetCounts));
        const potentialKills = Object.keys(targetCounts).filter(uid => targetCounts[uid] === maxVotes);

        const selectedKillUid = potentialKills.length === 1
            ? potentialKills[0]
            : potentialKills[Math.floor(Math.random() * potentialKills.length)];
        const killedPlayerData = players.find(p => p.uid === selectedKillUid);
        if (!killedPlayerData) return;

        // ✅ If protected, skip killing
        if (killedPlayerData.isProtected) {
            console.log(`${killedPlayerData.name} was protected!`);
            setKilledPlayer({ ...killedPlayerData, protected: true }); // optional: explicitly show "no one died"
            return;
        }

        setKilledPlayer(killedPlayerData);

        const gameRef = doc(db, 'games', roomId);
        const updatedPlayers = players.map(player =>
            player.uid === killedPlayerData.uid ? { ...player, alive: false } : player
        );

        const updatedKillBox = game.killBox.map((kb, index) =>
            index === roundKillBoxIndex ? { ...kb, killed: killedPlayerData } : kb
        );

        updateDoc(gameRef, {
            players: updatedPlayers,
            killBox: updatedKillBox
        }).then(() => {
            console.log("Updated killed player:", killedPlayerData);
        }).catch(error => {
            console.error("Error updating killed player:", error);
        });

    }, [game.killBox, players, game.currentRound, roomId, db]);

    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };

    const isHost = game.hostId === currentUser?.uid;

    return (
        <div className="w-full max-w-3xl bg-red-500 bg-opacity-20 rounded-lg p-6 text-white font-pixel mx-auto">
            <h2 className="text-sm text-center text-red-500 mb-6">
                <span className="text-xl">🩸</span> The Reveal
            </h2>

            <img
                src={`/wallpapers/${killedPlayer?.isProtected ? "shield-protection.png" : "murder.webp"}`}
                alt="Reveal"
                className=" h-full object-cover rounded-lg border-b border-zinc-700 mb-4"
            />

            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 text-center text-xs">

                {killedPlayer ? (
                    <div className="font-bold mt-3 text-lg">
                        {killedPlayer.protected ? (
                            <>
                                <p className="text-yellow-300 text-sm">🛡️ A murder was attempted, but the villager was protected!</p>
                            </>
                        ) : (
                            <>
                                <span className='text-xs'>☠️ player killed was!</span>
                                <div className='flex flex-col my-4'>
                                    <span className='text-red-400'>{killedPlayer.character}</span>
                                    <span className='font-light text-gray-500 text-sm'>{killedPlayer.name}</span>
                                </div>
                                <img
                                    src={`/characters/${killedPlayer.characterSlug}.webp`}
                                    alt="Reveal"
                                    className="h-full object-cover rounded-lg border-b border-zinc-700 mb-4"
                                />
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-green-400 font-bold mt-3 text-sm">🌙 No one was killed this round.</p>
                )}

            </div>

            {isHost && (
                <div className="text-center mt-6">
                    <button
                        onClick={handleNext}
                        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white text-sm"
                    >
                        ✅ Next Stage
                    </button>
                </div>
            )}
        </div>
    );
}
