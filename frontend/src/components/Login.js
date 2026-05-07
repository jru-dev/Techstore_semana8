import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function Login() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'mfa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [mfaMethod, setMfaMethod] = useState(''); // 'TOTP' | 'EMAIL'
  const [mfaAttempts, setMfaAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Paso 1: Login con credenciales
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      if (response.data.requiresMFA) {
        // Guardar token temporal y método MFA, pasar al paso 2
        setTempToken(response.data.tempToken);
        setMfaMethod(response.data.mfaMethod);
        setStep('mfa');

        if (response.data.mfaMethod === 'EMAIL') {
          toast.success('Se ha enviado un código MFA a tu correo');
        } else {
          toast.success('Ingresa el código de Google Authenticator');
        }
      } else {
        // Sin MFA (no debería ocurrir según el backend actual, pero por si acaso)
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login exitoso');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código MFA
  const handleMFASubmit = async (e) => {
    e.preventDefault();

    if (mfaAttempts >= 3) {
      toast.error('Máximo de intentos alcanzado. Inicia sesión nuevamente.');
      handleReset();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-mfa`, {
        tempToken,
        mfaCode
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Acceso concedido');
      navigate('/');
    } catch (error) {
      const newAttempts = mfaAttempts + 1;
      setMfaAttempts(newAttempts);
      setMfaCode('');

      if (newAttempts >= 3) {
        toast.error('Máximo de intentos alcanzado. Inicia sesión nuevamente.');
        handleReset();
      } else {
        toast.error(`Código inválido. Intentos restantes: ${3 - newAttempts}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código por email
  const handleResendCode = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/send-mfa-code`, { tempToken });
      toast.success('Código reenviado a tu correo');
    } catch (error) {
      toast.error('Error reenviando código');
    }
  };

  // Volver al paso 1
  const handleReset = () => {
    setStep('credentials');
    setEmail('');
    setPassword('');
    setMfaCode('');
    setTempToken('');
    setMfaMethod('');
    setMfaAttempts(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">

        {/* Paso 1: Credenciales */}
        {step === 'credentials' && (
          <>
            <h1 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">TechStore</h1>
            <p className="text-indigo-200 text-center mb-8">Inicia sesión en tu cuenta</p>
            <form onSubmit={handleCredentialsSubmit}>
              <div className="mb-4">
                <label className="block text-white/90 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white placeholder-white/30 transition-all"
                  placeholder="usuario@techstore.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-white/90 font-medium mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white placeholder-white/30 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500/80 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </>
        )}

        {/* Paso 2: Código MFA */}
        {step === 'mfa' && (
          <>
            <button
              onClick={handleReset}
              className="text-indigo-200 hover:text-white mb-4 flex items-center text-sm transition-colors"
            >
              ← Volver
            </button>

            <h1 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">Verificación MFA</h1>

            {mfaMethod === 'EMAIL' ? (
              <p className="text-indigo-200 text-center mb-8">
                Ingresa el código de 6 dígitos enviado a tu correo. Válido por 5 minutos.
              </p>
            ) : (
              <p className="text-indigo-200 text-center mb-8">
                Ingresa el código de 6 dígitos de tu aplicación Google Authenticator.
              </p>
            )}

            {/* Indicador de intentos */}
            {mfaAttempts > 0 && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-200 backdrop-blur-sm">
                Intentos fallidos: {mfaAttempts}/3
              </div>
            )}

            <form onSubmit={handleMFASubmit}>
              <div className="mb-6">
                <label className="block text-white/90 font-medium mb-2">Código MFA</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white placeholder-white/30 text-center text-3xl tracking-[0.5em] transition-all font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-indigo-500/80 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>

            {/* Reenviar código solo si es EMAIL */}
            {mfaMethod === 'EMAIL' && (
              <button
                onClick={handleResendCode}
                className="w-full mt-4 text-indigo-300 hover:text-white transition-colors text-sm"
              >
                Reenviar código al correo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Login;