import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export default function useGameData(roomId) {
    const [players, setPlayers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [game, setGame] = useState({});
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth(app);
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });

        return () => unsubAuth();
    }, [router]);

    useEffect(() => {
        if (!roomId) return;

        const gameRef = doc(db, 'games', roomId);
        const unsub = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) {
                router.push('/');
                return;
            }

            const gameData = snapshot.data();
            setGame(gameData);
            setPlayers(gameData.players);

            // 🚀 Auto-sync player URL to Firestore state
            if (gameData.currentRound > 0 && gameData.currentStage > 0) {
                const expectedPath = `/game/${roomId}/round/${gameData.currentRound}/stage/${gameData.currentStage}`;
                if (router.asPath !== expectedPath) {
                    router.push(expectedPath);
                }
            }
        });

        return () => unsub();
    }, [roomId, router]);

    return { players, currentUser, game };
}
