import React from 'react'

const FortuneTeller = ({ character }) => {
    return (
        <div className='flex flex-col'>
            <span>{character.character}</span>
            <span>{character.characterSlug}</span>
            <span className='text-xs text-gray-400'>{character.ability}</span>
        </div>
    )
}

export default FortuneTeller