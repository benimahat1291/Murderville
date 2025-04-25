export const gameEvents = {
    "hand-your-dealt": (game) => {
        if (!game || !game.players) return null;
        return {
            type: "hand-youre-dealt",
            name: "The Hand You’re Dealt",
            message: "You have been dealt two random cards. Choose to play or fold.",
            image: "hand-youre-dealt.png",
        };
    },
    "mission-divide": (game) => {
        if (!game || !game.players) return null;
        return {
            type: "mission-divide",
            name: "Mission Divide",
            message: "The town must split up into two groups and depart on a mission!",
            image: "mission-divide.png",
        };
    },
};

// Function to randomly pick an event
export const getRandomEvent = () => {
    const eventKeys = Object.keys(gameEvents);
    const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    return gameEvents[randomKey];
};
