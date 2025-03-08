import { useRouter } from 'next/router';
import EventStage from './EventStage';
import MarketStage from './MarketStage';
import CouncelStage from './CouncelStage';
import SuspectStage from './SuspectStage';
import ResolutionStage from './ResolutionStage';

const stages = {
    1: EventStage,
    2: MarketStage,
    3: CouncelStage,
    4: SuspectStage,
    5: ResolutionStage
};

export default function StagePage() {
    const { stage, roomId, round } = useRouter().query;

    const StageComponent = stages[stage] || (() => <p>Invalid Stage</p>);
    return <StageComponent stage={stage} roomId={roomId} round={round} />;
}
