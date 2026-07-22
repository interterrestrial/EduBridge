'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'An error occurred during login');
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue your learning journey</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.glassCard} style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.linkText}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
