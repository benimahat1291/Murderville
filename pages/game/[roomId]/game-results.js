import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../utils/firebase';

const GameResults = () => {
  const router = useRouter();
  const { roomId } = router.query; // Get roomId from URL
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        console.error("User not authenticated. Redirecting to login...");
        router.push('/login'); // Redirect to login page if not authenticated
        return;
      }

      setUser(currentUser);
      fetchGameData(currentUser);
    });

    return () => unsubscribe();
  }, [roomId]);

  const fetchGameData = async (currentUser) => {
    if (!roomId || !currentUser) return;

    try {
      const gameRef = doc(db, 'games', roomId);
      const gameSnap = await getDoc(gameRef);

      if (gameSnap.exists()) {
        setGameData(gameSnap.data());
      } else {
        console.error('Game not found');
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading game results...</p>;
  if (!gameData) return <p>Game data not found.</p>;

  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Game Over</h1>
        <p className="text-lg mt-2">Room ID: {roomId}</p>
        <p className="text-lg">Winner: {gameData.winner || 'No winner determined'}</p>
      </div>
    </div>
  );
};

export default GameResults;
