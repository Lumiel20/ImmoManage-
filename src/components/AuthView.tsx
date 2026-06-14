import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Key } from 'lucide-react';

interface AuthViewProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  handleGoogleSignIn: () => void;
}

export function AuthView({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  authError,
  setAuthError,
  loading,
  handleLogin,
  handleRegister,
  handleGoogleSignIn
}: AuthViewProps) {
  return (
    <div id="auth-root" className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10"
      >
        <div id="auth-header" className="flex items-center gap-3 mb-8">
          <div id="auth-logo-wrapper" className="p-1 bg-indigo-500/10 rounded-xl border border-indigo-500/20 w-14 h-14 overflow-hidden flex items-center justify-center shrink-0">
            <img src="/logo.svg" className="w-12 h-12 select-none" alt="ImmoManage Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 id="auth-title" className="text-2xl font-bold text-white tracking-tight">ImmoManage</h1>
            <p id="auth-subtitle" className="text-neutral-400 text-sm">Gestion Immobilière avec Firebase Auth</p>
          </div>
        </div>

        <div id="auth-tabs" className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 mb-6">
          <button 
            id="tab-btn-login"
            onClick={() => { setAuthMode('login'); setEmail(''); setPassword(''); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button 
            id="tab-btn-register"
            onClick={() => { setAuthMode('register'); setEmail(''); setPassword(''); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {authError && (
          <div id="auth-error-banner" className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-sans space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Erreur de Configuration Firebase</p>
                <p className="mt-1 leading-relaxed">{authError}</p>
              </div>
            </div>
            {(authError.includes('not-allowed') || authError.includes('Firebase') || authError.includes('authentification')) && (
              <div id="firebase-fix-instructions" className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 space-y-2 font-sans mt-2">
                <p className="font-bold text-white text-[11px] uppercase tracking-widest text-indigo-400">📊 Comment résoudre :</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 leading-normal">
                  <li>Ouvrez la <a href="https://console.firebase.google.com/project/skillful-tesla-rrwfn/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold inline-flex items-center gap-0.5">Console Firebase <span className="text-[10px]">↗</span></a></li>
                  <li>Cliquez sur <strong className="text-neutral-300 font-medium">"Commencer"</strong> (ou "Activer" si demandé)</li>
                  <li>Activez le fournisseur de connexion :
                    <ul className="list-disc list-inside pl-4 mt-1 text-neutral-400">
                      <li><strong className="text-neutral-200">Adresse e-mail et mot de passe</strong></li>
                      <li><strong className="text-neutral-200">Google</strong></li>
                    </ul>
                  </li>
                </ol>
                <p className="text-[10px] text-neutral-500 leading-normal mt-1 border-t border-neutral-800/40 pt-1.5 font-mono">
                  ID Projet : skillful-tesla-rrwfn
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {authMode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 ml-1">Prénom</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                  placeholder="Jean"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 ml-1">Nom</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
              placeholder="votre@email.com"
              required
                />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 ml-1">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
          >
            <Key className="w-4 h-4" />
            {loading ? "Chargement..." : authMode === 'login' ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-900 px-3 text-neutral-500">Ou continuer avec</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50 font-sans"
        >
          <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 0 12 0 7.37 0 3.39 2.67 1.44 6.56l3.84 2.98C6.19 6.84 8.87 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44H18.44c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.31-4.79 3.31-8.37z"/>
            <path fill="#FBBC05" d="M5.28 14.78C5.04 14.07 4.9 13.32 4.9 12.5s.14-1.57.38-2.28L1.44 7.24C.52 9.07 0 11.23 0 12.5s.52 3.43 1.44 5.26l3.84-2.98z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.6-2.79c-.99.66-2.26 1.06-3.96 1.06-3.13 0-5.81-1.8-6.76-4.5H1.44v2.98C3.39 21.33 7.37 24 12 24z"/>
          </svg>
          Se connecter avec Google
        </button>
      </motion.div>
    </div>
  );
}
