import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-press-start',
    display: 'swap',
});

export default function Page({ children }) {
    return (
        <div
            className={`${pressStart2P.variable} font-pixel min-h-screen bg-cover bg-center bg-no-repeat `}
            style={{ backgroundImage: "url('/wallpapers/village-entry.webp')" }}
        >
            <div className='bg-black bg-opacity-60'>
                <div className="flex flex-col items-center justify-center min-h-screen max-w-[425px] mx-auto space-y-4  p-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
