import { useState } from 'react';

export default function CouncelVoting({ players, currentUser, onVotesSubmitted, voteCount = 1 }) {
    const [selectedVotes, setSelectedVotes] = useState([]);
    const maxVotes = voteCount;
    const currentPlayer = players.find(p => p.uid === currentUser.uid);
    const voteOptions = players.filter(p => p.uid !== currentUser.uid && p.alive);

    const handleVote = (playerUid) => {
        if (selectedVotes.includes(playerUid)) {
            setSelectedVotes(selectedVotes.filter(v => v !== playerUid));
        } else if (selectedVotes.length < maxVotes) {
            setSelectedVotes([...selectedVotes, playerUid]);
        }
    };

    const submitVotes = () => {
        if (selectedVotes.length !== maxVotes) {
            alert(`You must vote exactly ${maxVotes} times.`);
            return;
        }
        onVotesSubmitted(selectedVotes);
    };

    // If the current player is not alive, show "Waiting for votes..."
    if (!currentPlayer || !currentPlayer.alive) {
        return <p className="text-gray-500 h-24 flex items-center">Waiting for votes...</p>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Vote for who you suspect!</h2>
            <p>You must vote for {maxVotes} players.</p>
            <div className="space-y-2 space-x-2 flex flex-wrap">
                {voteOptions.map(player => (
                    <li key={player.uid} className="flex items-center space-x-2">
                        <button
                            onClick={() => handleVote(player.uid)}
                            className={`px-4 py-2 border rounded ${selectedVotes.includes(player.uid) ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                        >
                            {player.name}-{player.character}
                        </button>
                    </li>
                ))}
            </div>
            <button
                onClick={submitVotes}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded"
            >
                Submit Votes
            </button>
        </div>
    );
}
