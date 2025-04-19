import React from 'react'

const Priest = ({ character }) => {
    return (
        <div className='flex flex-col'>
            <span>{character.character}</span>
            <span>{character.characterSlug}</span>
            <span className='text-xs text-gray-400'>{character.ability}</span>
        </div>
    )
}

export default Priest