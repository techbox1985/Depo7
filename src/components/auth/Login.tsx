import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, EyeOff } from 'lucide-react';
import { useCompanySettingsHeader } from '../../hooks/useCompanySettingsHeader';

export const Login: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('techbox.argentina@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { company } = useCompanySettingsHeader();

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
    console.log('handleLogin start');
    console.log('Email:', email);
    if (!email || !password) {
      console.log('Guard: email/password vacíos');
      setError('Por favor, ingresa email y contraseña.');
      console.log('handleLogin end');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log('Resultado signInWithPassword:', result);
      if (result.error) {
        setError('Credenciales inválidas o error de conexión.');
        console.log('Error:', result.error);
      } else if (result.data) {
        console.log('User/session:', result.data);
        navigate('/');
      }
    } catch (err) {
      console.log('Excepción en signInWithPassword:', err);
    }
    setLoading(false);
    console.log('handleLogin end');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 transition-all duration-500 ease-in-out">
        <div className="flex flex-col items-center">
          <img
            className="h-32 w-auto object-contain rounded-lg cursor-pointer transition-transform active:scale-95"
            src={company?.logo_url || 'https://depo7.com/logo-depo7.png'}
            alt="Logo"
            onClick={handleLogoClick}
            title={!showForm ? "Acceso al sistema" : ""}
          />
          <Button
            type="button"
            variant="secondary"
            className="mt-6 w-full flex justify-center items-center gap-2"
            onClick={async () => {
              setLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
              });
              if (error) {
                setError('Error al iniciar sesión con Google.');
                setLoading(false);
              }
            }}
            isLoading={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Ingresar con Google
          </Button>
          {!showForm && (
            <h2 className="mt-6 text-center text-xl font-medium tracking-tight text-gray-500 uppercase tracking-widest">
              Depo7
            </h2>
          )
          }
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
                placeholder="ejemplo@depo7.com"
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
              {/* Botón nativo temporal para diagnóstico */}
              <button type="submit" className="w-full flex justify-center">
                Ingresar
              </button>
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
