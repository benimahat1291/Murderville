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
        <div className="w-full px-4 sm:px-6 md:px-0 max-w-6xl mx-auto mt-6 text-white font-pixel">
            <h2 className="text-xl text-yellow-400 mb-2 text-center">🔍 Vote for Who You Suspect!</h2>
            <p className="text-sm text-center mb-6 text-gray-300">You must vote for {maxVotes} players.</p>

            <div className="grid grid-cols-3  ">
                {voteOptions.map((player) => {
                    const isSelected = selectedVotes.includes(player.uid);

                    return (
                        <div
                            key={player.uid}
                            className={`relative w-full overflow-hidden border-2 rounded-md shadow-md transition-all duration-300 ${isSelected ? 'border-red-600' : 'border-zinc-700'
                                }`}
                        >
                            <img
                                src={`/characters/${player.characterSlug || 'default'}.webp`}
                                alt={player.character}
                                onError={(e) => (e.currentTarget.src = '/characters/default.webp')}
                                className="w-full h-40 object-cover"
                            />

                            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-between p-2 text-xs text-white font-mono">
                                <div className="text-center font-bold">
                                    <p>{player.character}</p>
                                    <p className="italic text-gray-300">{player.name}</p>
                                </div>

                                <button
                                    onClick={() => handleVote(player.uid)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded shadow-md mt-2 transition ${isSelected ? 'bg-red-600 text-white' : 'bg-black hover:bg-red-700'
                                        }`}
                                >
                                    {isSelected ? '✅ Voted' : '🎯 Vote'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center mt-6">
                <button
                    onClick={submitVotes}
                    className="px-6 py-2 text-sm sm:text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded shadow-lg transition"
                >
                    ✅ Submit Votes
                </button>
            </div>
        </div>

    );
}
