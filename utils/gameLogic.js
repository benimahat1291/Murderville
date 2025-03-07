// FILE: utils/gameLogic.js
export function assignRoles(players) {
    const mafiaCount = players.length <= 8 ? 2 : 3;

    const shuffled = [...players].sort(() => Math.random() - 0.5);

    return shuffled.map((player, index) => ({
        ...player,
        role: index < mafiaCount ? 'mafia' : 'villager'
    }));
}


export function randomBotVote(players, selfId) {
    const alivePlayers = players.filter((p) => p.id !== selfId && p.alive);
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return target.id;
}