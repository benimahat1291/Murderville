import React from 'react'

const CouncelResults = ({ votesResult }) => {
    return (
        <div>
            <h2 className="text-xl text-green-500 font-bold">Vote Results</h2>
            <ul>
                {votesResult.map((player, index) => (
                    <li className={`${index === 0 && "bg-red-200 p-2"} flex flex-col mb-2`} key={player.uid}>
                        {index === 0 && <span className='text-red-500 font-bold'>Exiled</span>}
                        <span className={`${index === 0 && "font-bold"}`}>{player.character}</span>

                        <span>{player.voteCount} votes <span className='text-sm'>- {player.votes.join(', ')}</span> </span>

                    </li>
                ))}
            </ul></div>
    )
}

export default CouncelResults