import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

let socket;

export default function GameRoom() {
    const router = useRouter();
    const { roomId } = router.query;

    const [players, setPlayers] = useState([]);
    const [phase, setPhase] = useState('night');
    const [round, setRound] = useState(1);
    const [yourRole, setYourRole] = useState('');

    useEffect(() => {
        if (!roomId) return;

        socket = io({ path: '/api/socket' });

        const playerName = `Player-${Math.floor(Math.random() * 1000)}`;
        socket.emit('joinRoom', roomId, playerName);

        socket.on('updatePlayers', (allPlayers) => {
            setPlayers(allPlayers);
        });

        socket.on('yourRole', (role) => {
            setYourRole(role || 'Unknown');
        });

        return () => socket.disconnect();
    }, [roomId]);

    const handleVote = (votedPlayerId) => {
        socket.emit('vote', { roomId, votedPlayerId });
    };

    return (
        <div>
            <h1>Game Room - {roomId}</h1>
            <h2>Round {round}</h2>
            <h3>Phase: {phase}</h3>
            <p><strong>Your Role:</strong> {yourRole}</p>

            <h4>Players:</h4>
            <ul>
                {players.map((p) => (
                    <li key={p.id}>
                        {p.name} ({p.role || 'Unknown'}) {p.alive ? '' : '💀'}
                        {phase === 'day' && p.alive && (
                            <button onClick={() => handleVote(p.id)}>Vote</button>
                        )}
                    </li>
                ))}
            </ul>

            {phase === 'night' && yourRole === 'mafia' && (
                <p>Decide who to kill tonight...</p>
            )}

            {phase === 'day' && (
                <p>Discuss and vote who to banish...</p>
            )}
        </div>
    );
}
