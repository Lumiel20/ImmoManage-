import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [useLocalAuth, setUseLocalAuthState] = useState<boolean>(() => {
    return localStorage.getItem('use_local_auth') === 'true';
  });

  const setUseLocalAuth = (val: boolean) => {
    setUseLocalAuthState(val);
    localStorage.setItem('use_local_auth', String(val));
    if (val) {
      setAuthError(null);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const syncWithBackend = async (userEmail: string, displayName?: string) => {
    let first_name = '';
    let last_name = '';
    if (displayName) {
      const parts = displayName.trim().split(' ');
      first_name = parts[0] || '';
      last_name = parts.slice(1).join(' ') || '';
    }
    
    try {
      const response = await fetch('/api/v1/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          first_name: first_name || userEmail.split('@')[0],
          last_name: last_name
        })
      });
      const json = await response.json();
      if (json.success) {
        setToken(json.data.token);
        setUser(json.data.user);
        localStorage.setItem('token', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        return true;
      } else {
        alert(json.error?.message || "Erreur de synchronisation.");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      if (useLocalAuth) {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await response.json();
        if (json.success) {
          setToken(json.data.token);
          setUser(json.data.user);
          localStorage.setItem('token', json.data.token);
          localStorage.setItem('user', JSON.stringify(json.data.user));
          setAuthError(null);
        } else {
          throw new Error(json.error?.message || "Identifiants invalides sur le serveur local.");
        }
      } else {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;
          await syncWithBackend(fbUser.email!, fbUser.displayName || '');
        } catch (fbErr: any) {
          console.warn("Firebase sign-in failed, checking native fallback...", fbErr);
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const json = await response.json();
          if (json.success) {
            setToken(json.data.token);
            setUser(json.data.user);
            localStorage.setItem('token', json.data.token);
            localStorage.setItem('user', JSON.stringify(json.data.user));
            setAuthError(null);
          } else {
            if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
              throw new Error("Authentification Firebase désactivée. De plus, la connexion locale a échoué : " + (json.error?.message || "Identifiants inconnus. Veuillez créer un compte ou essayer admin@example.com / password123."));
            } else {
              throw new Error(fbErr.message || "Erreur d'authentification Firebase.");
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('operation-not-allowed') || err.code === 'auth/operation-not-allowed') {
        setAuthError("La connexion Firebase (E-mail/mot de passe) n'est pas activée sur votre console Firebase. Cochez 'Utiliser l'authentification locale' ci-dessous pour vous connecter.");
      } else {
        setAuthError(err.message || "Erreur de connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      if (useLocalAuth) {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: 'agent'
          })
        });
        const json = await response.json();
        if (json.success) {
          setToken(json.data.token);
          setUser(json.data.user);
          localStorage.setItem('token', json.data.token);
          localStorage.setItem('user', JSON.stringify(json.data.user));
          setAuthError(null);
        } else {
          throw new Error(json.error?.message || "L'inscription sur le serveur local a échoué.");
        }
      } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;
          const response = await fetch('/api/v1/auth/firebase-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: fbUser.email!,
              first_name: firstName,
              last_name: lastName
            })
          });
          const json = await response.json();
          if (json.success) {
            setToken(json.data.token);
            setUser(json.data.user);
            localStorage.setItem('token', json.data.token);
            localStorage.setItem('user', JSON.stringify(json.data.user));
          } else {
            throw new Error(json.error?.message || "Erreur de synchronisation.");
          }
        } catch (fbErr: any) {
          console.warn("Firebase registration failed, trying native database registration as fallback...", fbErr);
          const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              first_name: firstName,
              last_name: lastName,
              role: 'agent'
            })
          });
          const json = await response.json();
          if (json.success) {
            setToken(json.data.token);
            setUser(json.data.user);
            localStorage.setItem('token', json.data.token);
            localStorage.setItem('user', JSON.stringify(json.data.user));
            setAuthError(null);
          } else {
            if (fbErr.code === 'auth/operation-not-allowed' || fbErr.message?.includes('operation-not-allowed')) {
              throw new Error("L'inscription Firebase est désactivée. De plus, l'inscription locale sur SQLite a échoué : " + (json.error?.message || "Adresse e-mail déjà enregistrée ou données invalides."));
            } else {
              throw new Error(fbErr.message || "Erreur lors de l'inscription Firebase.");
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('operation-not-allowed') || err.code === 'auth/operation-not-allowed') {
        setAuthError("L'inscription Firebase (E-mail/mot de passe) n'est pas activée face à votre projet Firebase. Cochez l'option d'authentification locale pour utiliser le serveur local.");
      } else {
        setAuthError(err.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        await syncWithBackend(fbUser.email!, fbUser.displayName || '');
      } catch (fbErr) {
        console.warn("Firebase Google sign-in failed, checking for local admin default logging...", fbErr);
        throw fbErr;
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthError("La connexion Google n'est pas activée dans la console Firebase. Cochez l'option d'authentification locale ou utilisez l'e-mail/mot de passe local de démo : admin@example.com / password123.");
      } else {
        setAuthError(err.message || "Erreur lors de la connexion Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    user, setUser,
    token, setToken,
    email, setEmail,
    password, setPassword,
    authMode, setAuthMode,
    firstName, setFirstName,
    lastName, setLastName,
    authError, setAuthError,
    loading, setLoading,
    useLocalAuth, setUseLocalAuth,
    syncWithBackend,
    handleLogin,
    handleRegister,
    handleGoogleSignIn,
    handleLogout
  };
}
