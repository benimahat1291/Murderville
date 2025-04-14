import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useGameData from '../../../../../../hooks/useGameData';
import PlayerList from '../../../../../../components/PlayerList';
import CouncelVoting from '../../../../../../components/CouncelVoting';
import { advanceToNextStageOrRound, saveVotesToFirestore, startVotingForAllPlayers } from '../../../../../../utils/gameLogic';
import { getFirestore, doc, onSnapshot, updateDoc, runTransaction } from 'firebase/firestore';
import CouncelResults from '../../../../../../components/CouncelResults';

const db = getFirestore();

export default function CouncelStage({ roomId, round, stage }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();

    const [votesResult, setVotesResult] = useState([]);
    const [allVotesSubmitted, setAllVotesSubmitted] = useState(false);
    const [votingStarted, setVotingStarted] = useState(false);
    const [votingComplete, setVotingComplete] = useState(false);

    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);
            }
        }
    }, [game.currentRound, game.currentStage, router]);

    const handleStartVoting = async () => {
        await startVotingForAllPlayers(roomId);

    };

    const handleVotesSubmitted = async (selectedVotes) => {
        if (allVotesSubmitted) return;
        await saveVotesToFirestore(roomId, game.currentRound, selectedVotes, currentUser);
    };
    useEffect(() => {
        const gameRef = doc(db, 'games', roomId);
        const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
            const gameData = snapshot.data();
            if (!gameData) return;

            setVotingStarted(gameData.votingStarted || false);

            // Check if there is a completed voting result for the current round
            const roundResults = gameData.councelResults?.find(res => res.round === game.currentRound);
            const hasVotingCompleted = roundResults?.votingComplete || false;
            setVotingComplete(hasVotingCompleted);

            if (hasVotingCompleted) {
                // Sort results by voteCount in descending order
                const sortedResults = roundResults.results.sort((a, b) => b.voteCount - a.voteCount);
                setVotesResult(sortedResults);
                setAllVotesSubmitted(true);

                // Identify the player with the most votes
                const playerToExile = sortedResults[0];
                console.log("playerToExile", playerToExile);

                // Update the player's alive status inside the `players` array
                try {
                    await runTransaction(db, async (transaction) => {
                        const gameDoc = await transaction.get(gameRef);
                        if (!gameDoc.exists()) return;

                        const gameData = gameDoc.data();

                        // Modify the `alive` status inside the `players` array
                        const updatedPlayers = gameData.players.map(player =>
                            player.uid === playerToExile.uid
                                ? { ...player, alive: false }
                                : player
                        );

                        transaction.update(gameRef, {
                            players: updatedPlayers,
                            votingStarted: false,
                            votingComplete: false,
                        });
                    });
                } catch (error) {
                    console.error('Transaction failed: ', error);
                }
            } else {
                setAllVotesSubmitted(false);
            }
        });

        return () => unsubscribe();
    }, [roomId, game.currentRound]);


    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };

    const isHost = game.hostId === currentUser?.uid;
    return (
        <div className="w-full max-w-3xl bg-opacity-20 rounded-lg p-4 text-white font-pixel mx-auto">
            <div className="">
                <h1 className="text-base text-white font-bold my-4"> {round}.{stage}) Council</h1>


                <img
                    src={`/wallpapers/council.webp`}
                    alt={"Council Voting"}
                    className="rounded-lg w-full h-40 object-cover border-b border-zinc-800"
                />

                <div className="mb-6 p-4 bg-black bg-opacity-50 rounded-xl mt-2 text-blue-100 text-[10px]">
                    <h3 className="text-sm font-bold mb-2">📜 How It Works</h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>All players vote to exile a player they suspect is a Murderer.</li>
                        <li>The player with the most votes will be exiled (marked as dead).</li>
                        <li>You may only vote once. Choose wisely.</li>
                    </ul>
                </div>

                {votingComplete ? (
                    <div className="mt-4">
                        <CouncelResults votesResult={votesResult} />
                    </div>
                ) : (
                    <>
                        {!votingStarted && isHost && (
                            <div className="text-center mt-4">
                                <button
                                    onClick={handleStartVoting}
                                    className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded  text-lg font-bold"

                                >
                                    ▶️ Start Voting
                                </button>
                            </div>
                        )}

                        {votingStarted && !allVotesSubmitted && (
                            <div className="mt-4">
                                <CouncelVoting
                                    players={players}
                                    currentUser={currentUser}
                                    onVotesSubmitted={handleVotesSubmitted}
                                    voteCount={1}

                                />
                            </div>
                        )}

                        {!votingStarted && !isHost && (
                            <p className="text-gray-300 text-center">⏳ Waiting for voting to start...</p>
                        )}
                    </>
                )}

                {isHost && allVotesSubmitted && (
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
        </div>
    );

}
