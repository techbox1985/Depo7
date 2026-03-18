import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('techbox.argentina@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset click count if not clicked for 2 seconds
  useEffect(() => {
    if (clickCount > 0 && clickCount < 5) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleLogoClick = () => {
    if (showForm) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowForm(true);
      setClickCount(0);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa email y contraseña.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenciales inválidas o error de conexión.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 transition-all duration-500 ease-in-out">
        <div className="flex flex-col items-center">
          <img
            className="h-32 w-auto object-contain rounded-lg cursor-pointer transition-transform active:scale-95"
            src="https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg"
            alt="Logo"
            onClick={handleLogoClick}
            title={!showForm ? "Acceso al sistema" : ""}
          />
          {!showForm && (
            <h2 className="mt-6 text-center text-xl font-medium tracking-tight text-gray-500 uppercase tracking-widest">
              Distribuidora
            </h2>
          )}
        </div>
        
        {showForm && (
          <form className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@shw.com"
              />
              <Input
                label="Contraseña"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full flex justify-center" isLoading={loading}>
                Ingresar
              </Button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setPassword('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <EyeOff className="h-4 w-4" />
                Ocultar acceso manual
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
