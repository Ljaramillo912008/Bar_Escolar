
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<Role>('PARENT');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    website: '' // Honeypot field
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus first field on mount and toggle
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
    // Reset errors when switching modes
    setFormError(null);
    setFieldErrors({});
  }, [isRegister]);

  const handleCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return { width: '0%', color: 'bg-slate-200', text: '' };
    if (len < 6) return { width: '33%', color: 'bg-red-500', text: 'Débil' };
    if (len < 10) return { width: '66%', color: 'bg-amber-500', text: 'Media' };
    return { width: '100%', color: 'bg-emerald-500', text: 'Fuerte' };
  };

  const strength = getPasswordStrength();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Check Honeypot
    if (formData.website) {
      console.warn("Bot detected via honeypot.");
      return false;
    }

    if (isRegister) {
      if (!formData.name) newErrors.name = "El nombre es obligatorio";
      if (formData.email !== formData.confirmEmail) {
        newErrors.confirmEmail = "Los correos no coinciden";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }
    
    if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isLockedOut) {
      setFormError("Demasiados intentos. Por favor, espere o contacte a soporte.");
      return;
    }

    if (!validate()) return;

    // Simulate Login Logic
    if (!isRegister) {
      // Hardcoded "fake" validation for demo
      const isValidUser = formData.email.includes('@') && formData.password.length >= 6;
      
      if (!isValidUser) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setIsLockedOut(true);
          setFormError("Cuenta bloqueada temporalmente por seguridad.");
        } else {
          setFormError("Credenciales inválidas. Inténtelo de nuevo.");
        }
        return;
      }
    }

    const mockUser: User = {
      id: role === 'STAFF' ? 'staff-1' : 'parent-123',
      name: formData.name || (role === 'STAFF' ? 'Personal del Bar' : 'Padre de Familia'),
      email: formData.email,
      role: role
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-50/30">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-700 border border-slate-100 neon-border">
        
        {/* Header Section */}
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-50"></div>
          <div className="relative z-10">
            <div className="bg-white/20 backdrop-blur-xl w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
            </div>
            <h2 className="text-3xl font-handwritten text-white mb-2 neon-text tracking-wide">
              {isRegister ? 'Registro' : 'Bienvenido'}
            </h2>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              ACCEDE A TU PANEL ESCOLAR
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          
          {/* Generic Error Message */}
          {formError && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold text-center animate-bounce-short">
              {formError}
            </div>
          )}

          {/* Role Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[48%] bg-white rounded-xl shadow-sm transition-all duration-500 ease-out ${role === 'STAFF' ? 'left-[50%]' : 'left-1.5'}`}></div>
            <button 
              onClick={() => setRole('PARENT')}
              className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${role === 'PARENT' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              Representante
            </button>
            <button 
              onClick={() => setRole('STAFF')}
              className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${role === 'STAFF' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              Personal Bar
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleCapsLock} className="space-y-4">
            {/* Honeypot Field */}
            <input 
              type="text" 
              name="website" 
              style={{ display: 'none' }} 
              tabIndex={-1} 
              autoComplete="off"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            />

            {isRegister && (
              <div className="floating-label-group animate-slide-fade-enter-active">
                <input 
                  ref={firstInputRef}
                  id="name"
                  type="text" 
                  required
                  placeholder=" "
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold text-slate-900" 
                />
                <label htmlFor="name">Nombre Completo</label>
                {fieldErrors.name && <p className="text-[9px] text-red-500 mt-1 font-bold px-2">{fieldErrors.name}</p>}
              </div>
            )}

            <div className="floating-label-group">
              <input 
                ref={!isRegister ? firstInputRef : null}
                id="email"
                type="email" 
                required
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold text-slate-900" 
              />
              <label htmlFor="email">Correo Electrónico</label>
            </div>

            {isRegister && (
              <div className="floating-label-group animate-slide-fade-enter-active">
                <input 
                  id="confirmEmail"
                  type="email" 
                  required
                  placeholder=" "
                  value={formData.confirmEmail}
                  onChange={(e) => setFormData({...formData, confirmEmail: e.target.value})}
                  className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 transition-all ${
                    formData.confirmEmail && formData.confirmEmail !== formData.email ? 'border-red-500' : 
                    formData.confirmEmail && formData.confirmEmail === formData.email ? 'border-emerald-500' : ''
                  }`} 
                />
                <label htmlFor="confirmEmail">Confirmar Correo</label>
                {fieldErrors.confirmEmail && <p className="text-[9px] text-red-500 mt-1 font-bold px-2">{fieldErrors.confirmEmail}</p>}
              </div>
            )}

            <div className="floating-label-group relative">
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                required
                minLength={6}
                placeholder=" "
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold text-slate-900" 
              />
              <label htmlFor="password">Contraseña</label>
              
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 mt-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.182-3.825M8.557 8.557a3.5 3.5 0 114.886 4.886M12 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.012 2.012M3 3l18 18" /></svg>
                )}
              </button>

              {isCapsLockOn && (
                <p className="absolute left-2 -bottom-5 text-[8px] text-amber-600 font-black uppercase tracking-tighter flex items-center bg-white px-1 z-20">
                  Bloq Mayús Activado
                </p>
              )}
            </div>

            {isRegister && (
              <div className="floating-label-group animate-slide-fade-enter-active">
                <input 
                  id="confirmPass"
                  type="password" 
                  required
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 transition-all ${
                    formData.confirmPassword && formData.confirmPassword !== formData.password ? 'border-red-500' : 
                    formData.confirmPassword && formData.confirmPassword === formData.password ? 'border-emerald-500' : ''
                  }`} 
                />
                <label htmlFor="confirmPass">Confirmar Contraseña</label>
                {fieldErrors.confirmPassword && <p className="text-[9px] text-red-500 mt-1 font-bold px-2">{fieldErrors.confirmPassword}</p>}
              </div>
            )}

            {isRegister && formData.password.length > 0 && (
              <div className="mt-2 px-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fuerza</span>
                  <span className={`text-[8px] font-black uppercase ${strength.color.replace('bg-', 'text-')}`}>{strength.text}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${strength.color}`}
                    style={{ width: strength.width }}
                  ></div>
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="text-right">
                <button type="button" className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLockedOut}
              className={`w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black py-4 rounded-[1.5rem] shadow-xl hover:shadow-2xl active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] neon-button ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRegister ? 'Crear Cuenta' : 'Entrar'}
            </button>
          </form>

          {/* Toggle Switch */}
          <div className="pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-tight">
              {isRegister ? '¿Ya eres miembro?' : '¿Nuevo en EduEat?'}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="ml-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline"
              >
                {isRegister ? 'Inicia Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
