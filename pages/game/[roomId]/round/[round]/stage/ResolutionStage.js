import useGameData from '../../../../../../hooks/useGameData';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { handleEndRound } from '../../../../../../utils/itemLogic';
import PlayerItems from '../../../../../../components/PlayerItems';

export default function ResolutionStage({ roomId, round, stage, currentPlayer, }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();
    const db = getFirestore();

    const [killedPlayer, setKilledPlayer] = useState(null);
    const isHost = game.hostId === currentUser?.uid;

    useEffect(() => {
        if (!game.killBox || !players || !game.currentRound) return;

        const roundKillBox = game.killBox.find(kb => kb.round === game.currentRound);
        if (!roundKillBox || !roundKillBox.killed) return;

        setKilledPlayer(roundKillBox.killed);
    }, [game.killBox, game.currentRound, players]);


    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);
            }
        }
    }, [game.currentRound, game.currentStage, router]);

    const handleRevealKill = async () => {
        if (!game.killBox || !players) return;

        const roundKillBoxIndex = game.killBox.findIndex(kb => kb.round === game.currentRound);
        if (roundKillBoxIndex === -1) return;

        const roundKillBox = game.killBox[roundKillBoxIndex];

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
        if (!killedPlayerData) return console.log("Killed player not found");

        if (killedPlayerData.isProtected) {

            console.log(`${killedPlayerData.name} was protected!`);
            setKilledPlayer({ ...killedPlayerData, protected: true });
            return;
        } else {
            setKilledPlayer({ ...killedPlayerData, alive: false });
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
        }



    };

    const handleNext = async () => {
        await handleEndRound(game, roomId);
        await advanceToNextStageOrRound(roomId);
    };


    return (
        <div className="w-full max-w-3xl bg-red-500 bg-opacity-20 rounded-lg p-6 text-white font-pixel mx-auto">
            <h2 className="text-sm text-center text-red-500 mb-6">
                <span className="text-xl">🩸</span> The Reveal
            </h2>





            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 text-center text-xs">
                {killedPlayer && (
                    <div className="font-bold mt-3 text-lg">
                        {killedPlayer ? (
                            <div className="font-bold mt-3 text-lg relative w-full rounded-lg overflow-hidden">
                                {/* Background Image */}
                                <img
                                    src={
                                        killedPlayer.protected
                                            ? `/wallpapers/shield-protection.png`
                                            : killedPlayer.isRevived
                                                ? `/wallpapers/potion-revival.webp`
                                                : `/wallpapers/murder.webp`
                                    }
                                    alt="Reveal"
                                    className="w-full h-full object-cover rounded-lg"
                                />

                                {/* Overlay Content */}
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-center p-4">
                                    {killedPlayer.protected ? (
                                        <>
                                            <p className="text-yellow-300 text-sm">🛡️ A murder was attempted, but the villager was protected!</p>
                                            <div className="mt-2 text-white text-xs">{killedPlayer.character}</div>
                                        </>
                                    ) : killedPlayer.isRevived ? (
                                        <div className='flex flex-col justify-between h-full w-full'>
                                            <span className="text-green-300 text-[10px]">✨ <span className='uppercase'>{killedPlayer.character}</span> was revived with a potion!</span>

                                            <img
                                                src={`/characters/${killedPlayer.characterSlug}.webp`}
                                                alt="Character"
                                                className="mt-3 h-28 w-28 ml-auto rounded-full border-green-500 border-4 object-cover "
                                            />
                                        </div>
                                    ) : (
                                        <div className='flex flex-col justify-between h-full w-full'>
                                            <p className="text-red-300 text-xs">☠️ {killedPlayer.character} was killed!</p>
                                            <img
                                                src={`/characters/${killedPlayer.characterSlug}.webp`}
                                                alt="Character"
                                                className="mt-3 h-28 w-28 mx-auto rounded-full border-red-500 border-4 object-cover "

                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-green-400 font-bold mt-3 text-sm text-center">🌙 No one was killed this round.</p>
                        )}

                    </div>
                )}

                {isHost && !killedPlayer && (
                    <div className="text-center mb-6">
                        <button
                            onClick={handleRevealKill}
                            className="bg-red-700 hover:bg-red-800 px-6 py-2 rounded text-white text-sm"
                        >
                            🩸 Reveal Kill
                        </button>
                    </div>
                )}

            </div>

            {killedPlayer && <PlayerItems game={game} currentPlayer={currentPlayer} stage={stage} killedPlayer={killedPlayer} setKilledPlayer={setKilledPlayer} />}


            {
                isHost && (
                    <div className="text-center mt-6">
                        <button
                            onClick={handleNext}
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white text-sm"
                        >
                            ✅ Next Stage
                        </button>
                    </div>
                )
            }
        </div >
    );
}
