import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useGameData from '../../../../../../hooks/useGameData';
import { gameEvents, getRandomEvent } from '../../../../../../utils/gameEvents';
import { advanceToNextStageOrRound } from '../../../../../../utils/gameLogic';
import HandYoureDealt from '../../../../../../components/events/HandYoureDealt';
import MissionDivide from '../../../../../../components/events/MissionDivide';


export default function EventStage({ roomId, round, stage, currentUser }) {
    console.log("Event STAGE", roomId, round, stage, currentUser)
    const { game, updateGame } = useGameData(roomId);
    const router = useRouter();

    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (!game || !roomId || !round) return;

        let selectedEvent

        if (round === "1") {
            selectedEvent = gameEvents.handYoureDealt(game);
        } else if (round === "2") {
            selectedEvent = gameEvents.missionDivide(game);
        }

        setEvent(selectedEvent);
    }, [game, roomId, round]);



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
                ) : event?.type === "A Town Divided" ? ( // ✅ Ensure game.players is defined
                    <>
                        <MissionDivide gameData={game} currentUser={currentUser} isHost={isHost} currentRound={round} gameId={roomId} players={game.players} onComplete={handleGameCompletion} />
                    </>
                ) :


                    (
                        <p>Other event logic here...</p>
                    )}
            </div>


            {isHost && (
                <div className='w-full text-center'>
                    <button onClick={() => advanceToNextStageOrRound(roomId)} c
                        className="text-red-100 bg-black border-2 border-red-700 hover:bg-red-700 hover:text-black transition px-6 py-2 rounded  text-lg font-bold"

                    >
                        Next Stage
                    </button>
                </div>

            )}
        </div>
    );
}
