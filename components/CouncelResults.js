import React from 'react';

const CouncelResults = ({ votesResult }) => {
    return (
        <div className="w-full max-w-3xl bg-black bg-opacity-20 rounded-lg p-4 text-white font-pixel mx-auto">
            <h2 className="text-sm text-center text-red-500 mb-6">
                <span className="text-xl">🗳️</span> Council Results
            </h2>

            <ul className="space-y-3 text-[10px] max-h-[500px] overflow-y-auto">
                {votesResult.map((player, index) => (
                    <li
                        key={player.uid}
                        className={`rounded-lg p-3 flex bg-black bg-opacity-40  ${index === 0
                            ? 'bg-red-500 text-red-300 shadow-md flex-col'
                            : 'border-zinc-700 text-white flex-row '
                            }`}
                    >
                        <img
                            src={`/characters/${player.characterSlug || 'default'}.webp`}
                            alt={player.character}
                            onError={(e) => (e.currentTarget.src = `default.webp`)}
                            className={` object-cover ${index === 0 ? 'h-40' : 'w-20'}`}
                        />
                        <div className={`${index === 0 ? 'mt-2' : 'ml-2'} flex flex-col `}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold">
                                    {player.character}
                                    {index === 0 && <span className="ml-2 text-red-400">🔪 Exiled</span>}
                                </span>
                                <span className="text-green-300 font-bold">{player.voteCount} vote{player.voteCount > 1 ? 's' : ''}</span>
                            </div>

                            <div className="text-[9px] text-blue-200">
                                Voted by: <span className="italic">{player.votes.join(', ')}</span>
                            </div>
                        </div>

                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CouncelResults;
