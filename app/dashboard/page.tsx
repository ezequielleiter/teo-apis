'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light/50 to-primary-light/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-dark font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light/50 to-primary-light/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-primary-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-dark">TEO APIs</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-dark/70">{session.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-primary-light/20 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-dark mb-2">
              ¡Bienvenido al Dashboard!
            </h2>
            <p className="text-dark/70 mb-6">
              Has iniciado sesión exitosamente como {session.user?.email}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-light/20 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">APIs</h3>
            <p className="text-dark/60 text-sm">
              Gestiona tus APIs disponibles
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-light/20 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Perfil</h3>
            <p className="text-dark/60 text-sm">
              Administra tu cuenta y configuración
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-light/20 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary-light/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Documentación</h3>
            <p className="text-dark/60 text-sm">
              Revisa la documentación de APIs
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-light/20 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75M15.91 11.077a2.25 2.25 0 01-1.96 0M13.773 7.293c0-1.636 2.25-2.25 2.25-2.25s2.25.614 2.25 2.25-2.25 2.25-2.25 2.25-2.25-.614-2.25-2.25z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Soporte</h3>
            <p className="text-dark/60 text-sm">
              Obtén ayuda y soporte técnico
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-primary-light/20">
          <h3 className="text-xl font-semibold text-dark mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-light rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-dark font-medium">Sesión iniciada</p>
                <p className="text-dark/60 text-sm">Acabas de iniciar sesión</p>
              </div>
              <span className="text-primary text-sm">Ahora</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary-light/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-dark/60 text-sm">© 2026 TEO APIs. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="/help" className="text-dark/60 hover:text-primary text-sm transition-colors">
                Ayuda
              </Link>
              <Link href="/privacy" className="text-dark/60 hover:text-primary text-sm transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="text-dark/60 hover:text-primary text-sm transition-colors">
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}