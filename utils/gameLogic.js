// FILE: utils/gameLogic.js
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';



export function assignRoles(players) {
    const mafiaCount = players.length <= 8 ? 2 : 3;

    const shuffled = [...players].sort(() => Math.random() - 0.5);

    return shuffled.map((player, index) => ({
        ...player,
        role: index < mafiaCount ? 'mafia' : 'villager'
    }));
}

export async function advanceToNextStageOrRound(roomId) {
    const gameRef = doc(db, 'games', roomId);
    const snapshot = await getDoc(gameRef);

    if (!snapshot.exists()) throw new Error('Game not found');

    const game = snapshot.data();
    const { currentRound, currentStage } = game;

    if (currentStage < 5) {
        await updateDoc(gameRef, {
            currentStage: currentStage + 1,
            phase: `round-${currentRound}-stage-${currentStage + 1}`
        });
    } else {
        await updateDoc(gameRef, {
            currentRound: currentRound + 1,
            currentStage: 1,
            phase: `round-${currentRound + 1}-stage-1`
        });
    }
}
export async function saveVotesToFirestore(roomId, currentRound, selectedVotes, currentUser) {
    if (!roomId || !currentRound || !selectedVotes.length) return;

    const gameRef = doc(db, 'games', roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
        console.error("Game not found");
        return;
    }

    const gameData = gameSnap.data();
    const newCouncelResults = gameData.councelResults || [];
    const aliveHumanPlayers = gameData.players.filter(p => p.alive && !p.isBot);
    const botPlayers = gameData.players.filter(p => p.alive && p.isBot);

    // Save the current user's vote
    let newVotes = gameData.votes || {};
    newVotes[currentUser.uid] = selectedVotes;

    // Check if all alive humans have voted
    const allHumansVoted = aliveHumanPlayers.every(player => newVotes[player.uid]?.length > 0);

    if (allHumansVoted) {
        console.log("✅ All humans have voted. Bots will now cast votes.");

        // Bots cast their votes
        botPlayers.forEach(bot => {
            if (!newVotes[bot.uid]) {
                newVotes[bot.uid] = generateRandomVotes(gameData.players, bot.uid);
            }
        });

        // Count votes
        const voteCounts = {};
        Object.values(newVotes).flat().forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        // Format results with character names
        const votingResults = Object.keys(voteCounts).map(votedUid => {
            const votedPlayer = gameData.players.find(p => p.uid === votedUid);
            const voters = Object.keys(newVotes)
                .filter(voterUid => newVotes[voterUid].includes(votedUid))
                .map(voterUid => {
                    const voter = gameData.players.find(p => p.uid === voterUid);
                    return voter ? voter.character : "Unknown";
                });

            return {
                uid: votedUid,
                name: votedPlayer ? votedPlayer.name : "Unknown",
                character: votedPlayer ? votedPlayer.character : "Unknown",
                votes: voters,
                voteCount: voteCounts[votedUid]
            };
        });

        // Sort results by most votes
        votingResults.sort((a, b) => b.voteCount - a.voteCount);

        // **Ensure previous rounds' results remain intact**
        const existingRound = newCouncelResults.find(res => res.round === currentRound);

        if (existingRound) {
            console.warn(`❗ Round ${currentRound} results already exist, not overwriting.`);
        } else {
            newCouncelResults.push({
                round: currentRound,
                results: votingResults,
                votingComplete: true
            });
        }

        // Update Firestore with the new results
        await updateDoc(gameRef, {
            councelResults: newCouncelResults,
            votingComplete: true,
            votes: {}  // Reset votes for the next round
        });

        console.log(`✅ Round ${currentRound} voting results saved.`);
    } else {
        // Save partial votes
        await updateDoc(gameRef, { votes: newVotes });
        console.log(`🔄 ${currentUser.name} submitted votes. Waiting for others...`);
    }
}

// Function to generate random votes for bots
function generateRandomVotes(players, botUid, maxVotes = 3) {
    const voteOptions = players.filter(p => p.uid !== botUid && p.alive);
    const randomVotes = new Set();

    while (randomVotes.size < maxVotes && randomVotes.size < voteOptions.length) {
        const randomIndex = Math.floor(Math.random() * voteOptions.length);
        randomVotes.add(voteOptions[randomIndex].uid);
    }

    return Array.from(randomVotes);
}

export async function startVotingForAllPlayers(roomId) {
    const gameRef = doc(db, 'games', roomId);
    await updateDoc(gameRef, { votingStarted: true, votingComplete: false });
}
