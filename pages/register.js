import { useState, useEffect } from 'react';
import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';
import Page from '../components/layout/Page'; // adjust path if needed

export default function Register() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName });
            router.push('/');
        } catch (err) {
            handleAuthError(err);
        }
    };

    const handleAuthError = (err) => {
        if (err.code === 'auth/email-already-in-use') {
            setError('Email is already in use. Try logging in.');
        } else if (err.code === 'auth/invalid-email') {
            setError('Invalid email address.');
        } else if (err.code === 'auth/weak-password') {
            setError('Password should be at least 6 characters.');
        } else {
            setError('Failed to register. Please try again.');
        }
    };

    return (
        <Page>
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md bg-black bg-opacity-70 text-white p-6 rounded-xl shadow-lg space-y-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center font-pixel">Become a Villager</h1>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
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
                            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition"
                        >
                            Create Account
                        </button>
                    </form>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <p className="mt-4 text-center text-gray-300">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-400 hover:underline font-bold">
                            Login here
                        </a>
                    </p>
                </div>
            </div>
        </Page>
    );
}
