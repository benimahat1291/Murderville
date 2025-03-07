// pages/api/startgame.js

import games from '../../utils/gameState';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { roomId } = req.body;

    if (!games[roomId]) {
        return res.status(400).json({ error: 'Room not found' });
    }

    const players = games[roomId].players;

    if (players.length < 6) {
        return res.status(400).json({ error: 'Not enough players' });
    }

    const mafiaCount = 2; // Always 2 mafia for now
    const shuffled = players.sort(() => Math.random() - 0.5);

    shuffled.forEach((player, index) => {
        player.role = index < mafiaCount ? 'mafia' : 'villager';
    });

    games[roomId].phase = 'night';
    games[roomId].round = 1;

    const io = res.socket.server.io;

    players.forEach(player => {
        if (!player.isBot) {
            io.to(player.id).emit('yourRole', player.role);
        }
    });

    io.to(roomId).emit('updatePlayers', players);

    res.status(200).json({ success: true });
}
