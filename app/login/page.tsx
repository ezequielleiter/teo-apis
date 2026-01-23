'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setGeneralError('');

    try {
        console.log(formData);
        
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setGeneralError('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (result?.ok) {
        // Redirect to dashboard or home page
        router.push('/dashboard');
      }
    } catch (error) {
      setGeneralError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light/50 to-primary-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">TEO APIs</h1>
          <Image src="/images/logo-blanco.png" height={300} width={300} alt={''} />   
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-primary-light/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {generalError && (
              <div className="bg-secondary/10 border border-secondary text-secondary-hover rounded-lg p-4 text-sm">
                {generalError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-dark">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-0 text-dark placeholder:text-dark/50 ${
                  errors.email
                    ? 'border-secondary bg-secondary/5 focus:border-secondary'
                    : 'border-primary-light/30 focus:border-primary bg-white'
                }`}
                placeholder="tu@email.com"
                required
              />
              {errors.email && (
                <p className="text-secondary text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-dark">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-0 text-dark placeholder:text-dark/50 ${
                  errors.password
                    ? 'border-secondary bg-secondary/5 focus:border-secondary'
                    : 'border-primary-light/30 focus:border-primary bg-white'
                }`}
                placeholder="••••••••"
                required
              />
              {errors.password && (
                <p className="text-secondary text-sm">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                isLoading
                  ? 'bg-primary-light cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover focus:bg-primary-hover'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-primary-light/20"></div>
            <span className="px-3 text-sm text-dark/60">o</span>
            <div className="flex-1 h-px bg-primary-light/20"></div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <Link 
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <br />
            <Link 
              href="/"
              className="text-sm text-dark/60 hover:text-dark transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}