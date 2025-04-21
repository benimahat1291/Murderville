import useGameData from '../../../../../../hooks/useGameData';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Doctor from '../../../../../../components/characters/Doctor';
import Mayor from '../../../../../../components/characters/Mayor';
import Priest from '../../../../../../components/characters/Priest';
import Sherif from '../../../../../../components/characters/Sherif';
import Hunter from '../../../../../../components/characters/Hunter';
import FortuneTeller from '../../../../../../components/characters/FortuneTeller';
import Drunkard from '../../../../../../components/characters/Drunkard';
import PlayerItems from '../../../../../../components/PlayerItems';
import Gaurd from '../../../../../../components/characters/Gaurd';

export default function SuspectStage({ roomId, round, stage, currentPlayer }) {
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

    if (!currentPlayer) return null; // ✅ Moved after hooks

    const handleNext = async () => {
        await advanceToNextStageOrRound(roomId);
    };

    const isHost = game.hostId === currentUser?.uid;
    const characterSlug = currentPlayer?.characterSlug;


    return (
        <div className="">
            <h1 className="text-base text-white font-bold">{round}.{stage}) Suspect</h1>
            {/* 
            <div className="text-center bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <strong className="text-red-500 block text-sm">⚠️ THIS STAGE IS CURRENTLY UNAVAILABLE</strong>
                <p className="text-xs mt-2 text-gray-300">
                    Villagers will eventually be able to vote for 3 players they suspect are traitors.<br />
                    Points will be awarded based on accuracy to rank the best villagers.<br />
                    Murderers will also secretly vote on who to kill during this phase.
                </p>
            </div> */}
            {characterSlug === "doctor" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Doctor character={currentPlayer} />
            </div>}
            {characterSlug === "mayor" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Mayor character={currentPlayer} />
            </div>}
            {characterSlug === "priest" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Priest character={currentPlayer} />
            </div>}
            {characterSlug === "sherif" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Sherif character={currentPlayer} />
            </div>}
            {characterSlug === "hunter" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Hunter character={currentPlayer} />
            </div>}
            {characterSlug === "fortune-teller" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <FortuneTeller character={currentPlayer} />
            </div>}
            {characterSlug === "drunkard" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Drunkard character={currentPlayer} />
            </div>}
            {characterSlug === "gaurd" && <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 my-4">
                <Gaurd character={currentPlayer} />
            </div>}
            <div className="my-4">
                <PlayerItems stage={stage} game={game} currentPlayer={currentPlayer} />
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
