import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../utils/firebase';

export default function CouncelVoting({ players, currentUser, onVotesSubmitted, voteCount = 1, game }) {
    const [selectedVotes, setSelectedVotes] = useState([]);
    const [hasBoughtExtraVote, setHasBoughtExtraVote] = useState(false); // Track if Mayor buys extra vote
    const [isVotingDisabled, setIsVotingDisabled] = useState(false); // Disable voting while purchasing extra vote

    const currentPlayer = players.find(p => p.uid === currentUser.uid);
    const voteOptions = players.filter(p => p.uid !== currentUser.uid && p.alive);

    // If the Mayor has bought the extra vote, their one vote will count as 2
    const maxVotes = hasBoughtExtraVote ? 1 : voteCount; // Mayor can still vote once, but it's counted as 2

    const handleVote = (playerUid) => {
        if (selectedVotes.includes(playerUid)) {
            setSelectedVotes(selectedVotes.filter(v => v !== playerUid));
        } else if (selectedVotes.length < maxVotes) {
            setSelectedVotes([playerUid]);
        }
    };

    const submitVotes = () => {
        // Ensure the Mayor votes exactly once, but it's counted as 2
        if (selectedVotes.length !== 1) {
            alert(`You must vote exactly once.`);
            return;
        }

        onVotesSubmitted(selectedVotes);
    };

    const handleBuyExtraVote = async () => {
        if (currentPlayer.gold < 3) {
            alert('You need 3 gold to buy an extra vote.');
            return;
        }
        console.log(game)

        try {
            const gameRef = doc(db, "games", game.roomId); // make sure roomId is accessible
            const updatedPlayers = players.map(p =>
                p.uid === currentPlayer.uid
                    ? { ...p, gold: p.gold - 3, extraVoteUsedThisRound: true }
                    : p
            );

            await updateDoc(gameRef, { players: updatedPlayers });

            setHasBoughtExtraVote(true);
            setIsVotingDisabled(false);
        } catch (err) {
            console.error("❌ Failed to buy extra vote", err);
        }
    };

    // If the current player is not alive, show "Waiting for votes..."
    if (!currentPlayer || !currentPlayer.alive) {
        return <p className="text-gray-500 h-24 flex items-center">Waiting for votes...</p>;
    }
    console.log("currentPlayer", currentPlayer);

    // If the current player is the Mayor, show option to buy extra vote
    const isMayor = currentPlayer.characterSlug === 'mayor'; // Assuming "role" is a field that holds the player's role

    return (
        <div className="w-full px-4 sm:px-6 md:px-0 max-w-6xl mx-auto mt-6 text-white font-pixel">
            <h2 className="text-xl text-yellow-400 mb-2 text-center">🔍 Vote for Who You Suspect!</h2>
            <p className="text-sm text-center mb-6 text-gray-300">You must vote for 1 player (but the Mayor's vote counts as 2 votes for that player).</p>

            {/* If Mayor, display option to buy extra vote */}
            {isMayor && !hasBoughtExtraVote && (
                <div className="text-center mb-4">
                    <button
                        onClick={handleBuyExtraVote}
                        disabled={currentPlayer.gold >= 3 ? false : true}
                        className="px-6 py-2 text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg transition"
                    >
                        Buy Extra Vote (3 Coins)
                    </button>
                </div>
            )}

            <div className="grid grid-cols-3">
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
                                    disabled={isVotingDisabled} // Disable button if voting is disabled
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
                    disabled={isVotingDisabled} // Disable submit button if voting is disabled
                >
                    ✅ Submit Votes
                </button>
            </div>
        </div>
    );
}
