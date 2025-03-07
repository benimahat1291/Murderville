// pages/login.js
import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '../utils/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    // If already logged in, redirect to homepage
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Email + Password Login
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

    // Google Login
    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            router.push('/');
        } catch (err) {
            setError('Failed to sign in with Google.');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Login</h1>

            <form onSubmit={handleEmailLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ margin: '5px' }}
                />
                <br />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ margin: '5px' }}
                />
                <br />
                <button type="submit" style={{ margin: '10px', padding: '10px 20px' }}>Login with Email</button>
            </form>

            <p>OR</p>

            <button onClick={handleGoogleLogin} style={{ padding: '10px 20px' }}>Login with Google</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
    );
}
