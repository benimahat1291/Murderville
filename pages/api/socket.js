import { Server } from 'socket.io';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

const games = {};

// Initialize Firebase Admin
if (!getApps().length) {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('✅ Firebase Admin Initialized');
    } else {
        throw new Error(`❌ Missing serviceAccountKey.json file at ${serviceAccountPath}`);
    }
}

const db = getFirestore();

export default async function handler(req, res) {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server, { path: '/api/socket' });
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('✅ New player connected:', socket.id);

            socket.on('joinRoom', async (roomId, playerInfo) => {
                if (!games[roomId]) {
                    const gameRef = db.collection('games').doc(roomId);
                    const gameSnap = await gameRef.get();

                    if (gameSnap.exists) {
                        games[roomId] = gameSnap.data();
                    } else {
                        games[roomId] = {
                            players: [],
                            phase: 'lobby',
                            round: 1,
                            numPlayers: 12, // fallback if numPlayers is not saved
                        };
                    }
                }

                const numPlayers = games[roomId].numPlayers || 12;

                // Check if player already exists
                const existingPlayer = games[roomId].players.find(p => p.uid === playerInfo.uid);
                if (!existingPlayer) {
                    games[roomId].players.push({ ...playerInfo, id: socket.id });
                } else {
                    existingPlayer.id = socket.id; // Handle reconnection
                }

                // Always adjust to exactly `numPlayers`
                const realPlayers = games[roomId].players.filter(p => !p.isBot);

                // Remove all bots first
                games[roomId].players = realPlayers;

                // Fill with bots if needed
                while (games[roomId].players.length < numPlayers) {
                    const botNumber = games[roomId].players.filter(p => p.isBot).length + 1;
                    games[roomId].players.push({
                        id: `bot-${botNumber}`,
                        uid: `bot-${botNumber}`,
                        name: `Bot ${botNumber}`,
                        isHost: false,
                        role: null,
                        character: null,
                        gold: 0,
                        items: [],
                        role: null,
                        alive: true,
                        isBot: true,
                    });
                }

                // Make sure we don't go over the limit
                games[roomId].players = games[roomId].players.slice(0, numPlayers);

                socket.join(roomId);
                io.to(roomId).emit('updatePlayers', games[roomId].players);
            });

            socket.on('disconnect', () => {
                console.log('❌ Player disconnected:', socket.id);
                // You could optionally remove disconnected real players here if you want
            });
        });

        console.log('✅ Socket.IO server initialized');
    } else {
        console.log('⚠️ Socket.IO already running');
    }

    res.status(200).json({ success: true });
}
