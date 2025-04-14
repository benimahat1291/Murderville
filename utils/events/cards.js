const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, '10', 'J', 'Q', 'K'];

export const getCardImage = (suit, rank) => {
    return `/games/cards/card${suit}${rank}.png`;
};

export const getCardValue = (rank) => {
    if (typeof rank === 'number') return rank;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    if (rank === 'A' || rank === '1') return 1; // Optional: alias
    return parseInt(rank, 10);
};


// Optional: generate a full deck
export const generateDeck = () => {
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank, image: getCardImage(suit, rank) });
        }
    }
    return deck;
};
