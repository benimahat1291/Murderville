import React from 'react'

const Doctor = ({ character }) => {
    return (
        <div className='flex flex-col'>
            <span>{character.character}</span>
            <span className='text-xs text-gray-400'>{character.ability}</span>

        </div>
    )
}

export default Doctor