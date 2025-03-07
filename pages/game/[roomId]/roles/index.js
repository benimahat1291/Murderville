import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../../../utils/firebase';

const db = getFirestore(app);

export default function RolesPage() {
    const router = useRouter();
    const { roomId } = router.query;
    const [game, setGame] = useState([]);

    const [players, setPlayers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) setCurrentUser(user);
            else router.push('/login');
        });

        return () => unsubAuth();
    }, [router]);

    useEffect(() => {
        if (!roomId || !currentUser) return;

        const gameRef = doc(db, 'games', roomId);
        const unsub = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return router.push('/');

            const game = snapshot.data();
            setPlayers(game.players);
            setGame(game)
        });

        return () => unsub();
    }, [roomId, currentUser, router]);
    console.log(players, game)
    return (
        <div className="p-6 min-h-screen flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold">Game Started - Room {roomId}</h1>
            <ul className="list-disc space-y-2 text-lg">
                {players.map((p) => (
                    <li key={p.uid}>
                        {p.name} - {p.character}
                        {p.uid === currentUser?.uid ? (
                            <span className="font-bold text-red-500">
                                {p.isMurderer ? ' (You are a Murderer)' : ' (You are a Villager)'}
                            </span>
                        ) : (
                            <span className="font-bold">
                                {p.isMurderer ? ' (Role Hidden)' : ' (Role Hidden)'}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
