export default function PlayerList({ players, currentUser }) {
    console.log(players, currentUser)
    return (
        <ul className="list-disc space-y-2 text-lg">
            {players.map((p) => (
                <li key={p.uid}>
                    {p.name} - {p.character}

                    {p.alive ? (
                        <span className="font-bold ml-2 text-green-500">
                            A
                        </span>
                    ) :
                        <span className="font-bold ml-2 text-red-500">
                            D
                        </span>}
                    {p.uid === currentUser?.uid
                        && (
                            <span className=" text-red-500">
                                {p.isMurderer ? ' (Murderer)' : ' (Villager)'}
                            </span>
                        )}
                </li>
            ))}
        </ul>
    );
}
