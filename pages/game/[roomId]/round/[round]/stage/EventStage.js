import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useGameData from '../../../../../../hooks/useGameData';
import { gameEvents, getRandomEvent } from '../../../../../../utils/gameEvents';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import HandYoureDealt from '../../../../../../components/events/HandYoureDealt';

export default function EventStage({ roomId, round, stage, currentUser }) {
    const { game, updateGame } = useGameData(roomId);
    const router = useRouter();

    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (!game || !roomId) return;

        const selectedEvent = gameEvents.theHandYoureDealt(game);
        setEvent(selectedEvent);
    }, [game, roomId]);

    const handleGameCompletion = (updatedPlayers) => {
        updateGame({ players: updatedPlayers });
        advanceToNextStageOrRound(roomId);
    };

    const isHost = currentUser && game.hostId === currentUser.uid;

    return (
        <div className="">
            <h1 className="text-base text-white font-bold"> {round}.{stage}) Event</h1>

            {/* <div className="mt-4 bg-blue-100 p-2">
                <strong>{event?.type}</strong>
                <p className="text-lg">{event?.message || "Waiting for event selection..."}</p>
            </div> */}

            {/* Load the game component if the event is "The Hand You’re Dealt" */}
            <div className='mt-4 p-2'>
                {event?.type === "The Hand You’re Dealt" && game.players ? ( // ✅ Ensure game.players is defined
                    <>
                        <HandYoureDealt gameData={game} currentUser={currentUser} isHost={isHost} currentRound={round} gameId={roomId} players={game.players} onComplete={handleGameCompletion} />
                    </>
                ) : (
                    <p>Other event logic here...</p>
                )}
            </div>


            {isHost && (
                <button onClick={() => advanceToNextStageOrRound(roomId)} className="mt-4 bg-green-500 px-4 py-2 text-white rounded">
                    Next Stage
                </button>
            )}
        </div>
    );
}
