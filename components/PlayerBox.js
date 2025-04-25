import React, { useState } from 'react';

export default function PlayerBox({ player }) {
    if (!player) return null;
    console.log(player);
    const [showRole, setShowRole] = useState(false);

    return (
        <div className="w-full p-2 border border-yellow-400 rounded bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white">
            <h2 className="font-pixel text-xs text-white mb-2 flex justify-between">{player.character}  {player?.isHost && (
                <span className='bg-yellow-300 text-[7px] px-1 text-black'>
                    host
                </span>
            )}</h2>

            <div className='flex'>
                <div className='h-[75px] w-[150px]  border-2 border-yellow-300 overflow-hidden'>
                    <img
                        src={`/characters/${player.characterSlug || 'default'}.webp`}
                        alt={player.character}
                        onError={(e) => e.currentTarget.src = '/characters/default.webp'}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className='text-[10px] ml-2 flex-1'>
                    <div className='bg-black'>
                        <span className={player.alive ? 'text-green-400' : 'text-red-500'}>
                            {player.alive ? '🟢 Alive' : '🔴 Dead'}
                        </span>
                    </div>
                    <div className='flex items-center gap-1 mt-2'>
                        <span className='text-sm'><i className='hn hn-finance text-lg mr-1'></i>{player.gold ?? 0}</span>
                    </div>


                    <div className="font-bold text-[7px] flex items-center mt-2" >
                        <button onClick={() => setShowRole(!showRole)}>
                            <i className={`hn hn-info-circle ${showRole ? "text-red-300" : "text-white"} text-lg`} />
                        </button>

                    </div>




                </div>


            </div>

            {showRole &&
                <div className='text-gray-400 mt-2'>
                    <span className='text-xs'>Ability:</span>
                    <p className='text-[10px]'>
                        {player.ability}
                    </p>

                    < span className='ml-2 text-xs' >
                        {player.isMurderer ? "🔪" : "🛡️"}
                    </span>
                </div>
            }



        </div >
    );
}
