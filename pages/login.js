import { useState, useEffect } from 'react';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';
import Page from '../components/layout/Page';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err) {
            setError('Invalid email or password.');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            router.push('/');
        } catch (err) {
            setError('Failed to sign in with Google.');
        }
    };

    return (
        <Page>
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md bg-black bg-opacity-70 text-white p-6 rounded-xl shadow-lg space-y-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center font-pixel">Welcome to MurderVile</h1>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition"
                        >
                            Login with Email
                        </button>
                    </form>

                    <div className="text-center text-gray-300">OR</div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition"
                    >
                        Login with Google
                    </button>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <p className="mt-4 text-center text-gray-300">
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-400 hover:underline font-bold">
                            Register here
                        </a>
                    </p>
                </div>
            </div>
        </Page>
    );
}
