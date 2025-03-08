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
        <div className="p-6">
            <h1 className="text-2xl font-bold">Round {round} - Stage {stage}: Village Council</h1>
            <p>Players vote to exile a player they think is a Murderer</p>

            {votingComplete ? (
                <div className="mt-4">
                    <CouncelResults votesResult={votesResult} />
                </div>
            ) : (
                <>
                    {!votingStarted && isHost && (
                        <button
                            onClick={handleStartVoting}
                            className="mt-4 bg-blue-500 px-4 py-2 text-white rounded"
                        >
                            Start Voting
                        </button>
                    )}

                    {votingStarted && !allVotesSubmitted && (
                        <CouncelVoting
                            players={players}
                            currentUser={currentUser}
                            onVotesSubmitted={handleVotesSubmitted}
                        />
                    )}

                    {!votingStarted && !isHost && (
                        <p className="text-gray-500">Waiting for voting to start...</p>
                    )}
                </>
            )}

            {isHost && allVotesSubmitted && (
                <button
                    onClick={handleNext}
                    className="mt-4 bg-green-500 px-4 py-2 text-white rounded"
                >
                    Next Stage
                </button>
            )}

        </div>
    );
}
