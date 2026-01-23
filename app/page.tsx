import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Hero Section */}
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-primary mb-4">
                TEO APIs
              </h1>
              <p className="text-xl text-base-content/70 mb-8">
                Sistema de gestión de APIs
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="badge badge-primary badge-lg">RESTful</div>
                <div className="badge badge-secondary badge-lg">Escalable</div>
                <div className="badge badge-accent badge-lg">Seguro</div>
                <div className="badge badge-success badge-lg">Confiable</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">�</div>
                  <h3 className="card-title text-primary">APIs Rápidas</h3>
                  <p className="text-base-content/70">
                    Servicios optimizados para máxima velocidad y eficiencia
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">🔗</div>
                  <h3 className="card-title text-primary">Integración Fácil</h3>
                  <p className="text-base-content/70">
                    Conecta tus aplicaciones con nuestras APIs de forma sencilla
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">�️</div>
                  <h3 className="card-title text-primary">Seguridad</h3>
                  <p className="text-base-content/70">
                    Autenticación robusta y protección de datos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn btn-primary btn-lg">
                Iniciar Sesión
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
              <Link href="/register" className="btn btn-outline btn-lg">
                Registrarse
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-base-100 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-base-content mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Una plataforma completa diseñada para ofrecer servicios API robustos y escalables
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Alto Rendimiento</h3>
              <p className="text-base-content/70">
                APIs optimizadas para respuestas rápidas y eficientes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguridad Avanzada</h3>
              <p className="text-base-content/70">
                Autenticación y autorización robusta para proteger tus datos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitoreo</h3>
              <p className="text-base-content/70">
                Métricas y análisis detallados del uso de las APIs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
        <nav className="grid grid-flow-col gap-4">
          <a className="link link-hover">Sobre Nosotros</a>
          <a className="link link-hover">Contacto</a>
          <a className="link link-hover">Términos</a>
          <a className="link link-hover">Privacidad</a>
        </nav>
        <aside>
          <p className="text-base-content/70">
            © 2026 TEO APIs. Sistema de gestión.
          </p>
        </aside>
      </footer>
    </div>
  );
}
