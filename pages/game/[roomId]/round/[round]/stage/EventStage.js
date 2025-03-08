import useGameData from '../../../../../../hooks/useGameData';
import PlayerList from '../../../../../../components/PlayerList';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventStage({ roomId, round, stage }) {
    const { players, currentUser, game } = useGameData(roomId);
    const router = useRouter();

    useEffect(() => {
        if (game.currentRound && game.currentStage) {
            const expectedPath = `/game/${roomId}/round/${game.currentRound}/stage/${game.currentStage}`;
            if (router.asPath !== expectedPath) {
                router.push(expectedPath);  // ✅ Works if router comes from useRouter()
            }

        }
    }, [game.currentRound, game.currentStage, router]);

    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };
    const isHost = game.hostId === currentUser?.uid;

    console.log("Game", game);

    return (
        <div className="p-6">
            <h1 className="text-sm font-bold">Round {round} - Stage {stage}: EVENT OCCURS</h1>
            <strong>THIS STAGE IS CURRENTLY UNAVIALIABLE</strong>
            <p>Some sort of Event takes Place in the Village... Game mode where players are given a task to earn gold for the village</p>

            {isHost && (
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
