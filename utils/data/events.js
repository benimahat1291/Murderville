const events = [
    {
        eventId: "flood",
        title: "Flood Hits the Village",
        description: "Water washes away supplies.",
        rules: { goldLost: 5, itemChance: 0.2 }
    },
    {
        eventId: "fire",
        title: "Fire in the Tavern",
        description: "Players must work together to save the building.",
        rules: { teamwork: true, itemReward: "waterBucket" }
    }
];

export default events;
