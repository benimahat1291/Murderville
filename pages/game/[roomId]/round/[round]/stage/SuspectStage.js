import useGameData from '../../../../../../hooks/useGameData';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SuspectStage({ roomId, round, stage }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();

    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);
            }
        }
    }, [game.currentRound, game.currentStage, router]);

    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };

    const isHost = game.hostId === currentUser?.uid;

    return (
        <div className="">
            <h1 className="text-base text-white font-bold">{round}.{stage}) Suspect</h1>

            <div className="text-center bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <strong className="text-red-500 block text-sm">⚠️ THIS STAGE IS CURRENTLY UNAVAILABLE</strong>
                <p className="text-xs mt-2 text-gray-300">
                    Villagers will eventually be able to vote for 3 players they suspect are traitors.<br />
                    Points will be awarded based on accuracy to rank the best villagers.<br />
                    Murderers will also secretly vote on who to kill during this phase.
                </p>
            </div>

            {isHost && (
                <div className='w-full text-center'>
                    <button
                        onClick={handleNext}
                        className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded text-lg font-bold"
                    >
                        Next Stage
                    </button>
                </div>
            )}
        </div>
    );
}
