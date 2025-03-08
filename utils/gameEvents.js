export const gameEvents = {
    theHandYoureDealt: (game) => {
        if (!game || !game.players) return null;
        return {
            type: "The Hand You’re Dealt",
            message: "You have been dealt two random cards. Choose to play or fold."
        };
    },

    // villageFeast: (gameData) => {
    //     console.log("Village Feast Event: Players donate gold to the village.");
    //     return { type: "villageFeast", message: "A feast is happening! Donate gold to the village fund." };
    // },

    // banditRaid: (gameData) => {
    //     console.log("Bandit Raid Event: Players must defend their gold from bandits!");
    //     return { type: "banditRaid", message: "Bandits are attacking! Protect your gold!" };
    // },

    // stormComing: (gameData) => {
    //     console.log("Storm Event: A storm is coming! Brace for impact.");
    //     return { type: "stormComing", message: "A violent storm is on the horizon! Seek shelter." };
    // }
};

// Function to randomly pick an event
export const getRandomEvent = () => {
    const eventKeys = Object.keys(gameEvents);
    const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    return gameEvents[randomKey];
};
