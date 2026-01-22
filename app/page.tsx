import Link from "next/link";
import { formatearSuperficie } from "../lib/helpers/superficie";
import { getIncendiosStats } from "../lib/helpers/estadisticas";

export default async function Home() {
  const stats = await getIncendiosStats();
  return (
    <div className="bg-slate-900 font-display text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-orange-500/20 px-4 md:px-10 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between whitespace-nowrap">
          <div className="flex items-center gap-4 text-orange-400">
            <div className="size-8 relative">
            </div>
            <h2 className="text-white text-xl font-black leading-tight tracking-[-0.015em]">Matafuego Solidario</h2>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <nav className="flex items-center gap-9">
              <Link href="/incendios" className="text-orange-200 text-sm font-medium hover:text-orange-400 transition-colors">Incendios</Link>
              <Link href="/comparacion" className="text-orange-200 text-sm font-medium hover:text-orange-400 transition-colors">Comparador</Link>
              <a className="text-orange-200 text-sm font-medium hover:text-orange-400 transition-colors" href="#como-funciona">Cómo funciona</a>
              <a className="text-orange-200 text-sm font-medium hover:text-orange-400 transition-colors" href="#recursos">Recursos</a>
            </nav>
            <div className="flex gap-2">
              <Link href="/puntos-donacion" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/25">
                <span>Buscar Puntos</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Background Image */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/images/incendio-hero.jpg)',
            }}
          >
            {/* Gradient Overlay for dramatic effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-transparent to-red-900/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[1200px] mx-auto px-4 py-20 text-center text-white">
            <div className="max-w-5xl mx-auto">
              {/* Emergency Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 mb-8 bg-red-600/90 backdrop-blur-sm rounded-full border border-red-400/30">
                <div className="size-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold tracking-wider uppercase text-red-100">
                  Emergencia Nacional Activa
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-[-0.033em] mb-8">
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Matafuegos
                </span>
                <br />
                <span className="text-white drop-shadow-2xl">
                  Solidario
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl leading-relaxed mb-4 drop-shadow-lg max-w-4xl mx-auto font-medium">
                Localiza puntos de donación para luchar contra los incendios en la Patagonia
              </p>


              {/* Critical Stats Section */}
              <div className="mb-12 p-8 bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl md:text-5xl font-black text-red-400 mb-2">
                      {stats.incendiosActivos}
                    </div>
                    <div className="text-sm text-red-200 uppercase tracking-widest font-bold">
                      Focos Activos
                    </div>
                  </div>

                  <div className="flex flex-col items-center border-l border-orange-500/30 md:px-6">
                    <div className="text-3xl md:text-4xl font-black text-orange-400 mb-2">
                      {formatearSuperficie(stats.superficieTotalQuemada)}
                    </div>
                    <div className="text-sm text-orange-200 uppercase tracking-widest font-bold">
                      Superficie Total Quemada 2026
                    </div>
                  </div>
                </div>

                {stats.superficieTotalHectareas > 0 && (
                  <div className="mt-6 pt-6 border-t border-orange-500/20 text-center space-y-3">
                    <p className="text-red-200 text-base">
                      <span className="text-red-300 font-bold">
                        {stats.superficiePorDiaHectareas.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ha
                      </span> se queman por día en promedio
                    </p>
                  </div>
                )}
              </div>
              {/* Action Buttons */}
              {/* <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/puntos-donacion" className="group relative overflow-hidden flex min-w-[250px] cursor-pointer items-center justify-center rounded-2xl h-20 px-10 bg-gradient-to-r from-orange-500 via-red-600 to-red-700 text-white text-xl font-black shadow-2xl shadow-red-600/40 hover:shadow-orange-500/60 transition-all duration-300 transform hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Buscar Centros de Donación</span>
                </Link>
                <Link href="/registrar-centro" className="flex min-w-[250px] cursor-pointer items-center justify-center rounded-2xl h-20 px-10 border-2 border-orange-400/60 bg-black/40 backdrop-blur-sm text-orange-200 text-xl font-bold hover:bg-orange-500/20 hover:border-orange-400 transition-all duration-300 transform hover:scale-105">
                  <span>Registrar Punto</span>
                </Link>
              </div> */}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="bg-slate-900">

          {/* Feature Section (How it Works) */}
          <section className="px-4 py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden" id="como-funciona">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-500 rounded-full blur-2xl"></div>
            </div>

            <div className="relative max-w-[1200px] mx-auto">
              <div className="flex flex-col gap-16">
                <div className="flex flex-col gap-6 text-center items-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <div className="size-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-orange-300 text-sm font-bold uppercase tracking-widest">Protocolo de Ayuda</span>
                  </div>
                  <h2 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight">
                    ¿Cómo podés <span className="text-gradient bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">ayudar</span>?
                  </h2>
                  <p className="text-slate-300 text-xl max-w-3xl leading-relaxed">
                    Tres pasos fundamentales para que tu solidaridad llegue donde más se necesita en la lucha contra el fuego
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-orange-500/20 p-8 hover:border-orange-400/40 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg className="size-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <div className="flex flex-col gap-4">
                        <h3 className="text-white text-2xl font-black">
                          <span className="text-orange-400">1.</span> Buscá el centro más cercano
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          Encontrá puntos de donación verificados cerca de tu ubicación que estén recibiendo ayuda para combatir los incendios forestales.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-red-500/20 p-8 hover:border-red-400/40 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg className="size-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>

                      <div className="flex flex-col gap-4">
                        <h3 className="text-white text-2xl font-black">
                          <span className="text-red-400">2.</span> Doná elementos críticos
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          Llevá agua, alimentos no perecederos, herramientas, equipamiento de protección y medicamentos básicos para bomberos y evacuados.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-yellow-500/20 p-8 hover:border-yellow-400/40 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <svg className="size-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      <div className="flex flex-col gap-4">
                        <h3 className="text-white text-2xl font-black">
                          <span className="text-yellow-400">3.</span> Ya estás salvando vidas
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          Tu donación será coordinada para llegar directamente a los frentes de batalla contra el fuego donde más se necesite tu ayuda.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency contact banner */}
                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="size-16 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white text-xl font-bold">Emergencia: 100</h4>
                        <p className="text-red-200">Línea directa bomberos</p>
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-white font-medium">
                        Si ves un foco de incendio, evacuá inmediatamente y llamá al 100
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comparador Section */}
          <section className="px-4 py-24 bg-gradient-to-b from-slate-800 via-slate-900 to-black relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-orange-500/5 via-transparent to-red-500/5"></div>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-[1200px] mx-auto relative z-10">
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="material-symbols-outlined text-orange-400 text-5xl">compare</span>
                  <span className="material-symbols-outlined text-red-400 text-5xl">local_fire_department</span>
                </div>
                <h2 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
                  Dimensioná el
                  <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent block">
                    verdadero impacto
                  </span>
                </h2>
                <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                  Visualiza la magnitud real de los incendios comparando su superficie con lugares y estructuras conocidas
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left side - Features */}
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 size-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xl">stadium</span>
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-bold mb-2">Estadios y Lugares Deportivos</h3>
                      <p className="text-slate-300">
                        Compará con la cancha de River, el Maracaná, Camp Nou y otros lugares icónicos del deporte
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 size-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xl">account_balance</span>
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-bold mb-2">Monumentos Emblemáticos</h3>
                      <p className="text-slate-300">
                        Desde el Obelisco hasta las Pirámides de Egipto, entendé el tamaño real del daño
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 size-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xl">location_city</span>
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-bold mb-2">Áreas Urbanas</h3>
                      <p className="text-slate-300">
                        Visualizá la superficie quemada en relación a barrios, plazas y ciudades completas
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link href="/comparacion" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/25 transform hover:scale-105">
                      <span className="material-symbols-outlined">compare</span>
                      Explorar Comparador
                    </Link>
                  </div>
                </div>

                {/* Right side - Visual representation */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-8">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-orange-400 text-sm font-medium mb-2">Ejemplo de Comparación</div>
                        <div className="text-white text-2xl font-bold mb-1">
                          {stats.superficieTotalHectareas > 0 ? formatearSuperficie(stats.superficieTotalQuemada) : '500 hectáreas'}
                        </div>
                        <div className="text-slate-300 text-sm">Superficie total quemada</div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-orange-400">stadium</span>
                            <span className="text-white text-sm">Cancha de River</span>
                          </div>
                          <div className="text-orange-400 font-bold">
                            {stats.superficieTotalHectareas > 0 ? `${(stats.superficieTotalHectareas / 10.5).toFixed(1)}x` : '47.6x'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-400">account_balance</span>
                            <span className="text-white text-sm">Pirámide de Keops</span>
                          </div>
                          <div className="text-red-400 font-bold">
                            {stats.superficieTotalHectareas > 0 ? `${(stats.superficieTotalHectareas / 5.29).toFixed(1)}x` : '94.5x'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-blue-400">location_city</span>
                            <span className="text-white text-sm">Ciudad del Vaticano</span>
                          </div>
                          <div className="text-blue-400 font-bold">
                            {stats.superficieTotalHectareas > 0 ? `${(stats.superficieTotalHectareas / 44).toFixed(1)}x` : '11.4x'}
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-4 border-t border-slate-700">
                        <p className="text-slate-400 text-xs">
                          ¡Descubrí más comparaciones en el visualizador interactivo!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="px-4 py-24 bg-gradient-to-b from-slate-900 to-black relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 via-transparent to-red-500/10"></div>
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-red-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto text-center">
              {/* Emergency indicator */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-600/20 border border-red-500/30 rounded-full backdrop-blur-sm">
                  <div className="size-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-200 text-sm font-bold uppercase tracking-widest">
                    Cada minuto cuenta
                  </span>
                </div>
              </div>

              <h2 className="text-5xl md:text-7xl font-black leading-tight mb-8">
                <span className="text-white">Unite a la </span>
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                  red solidaria
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-slate-300 mb-4 leading-relaxed max-w-3xl mx-auto">
                Cada donación cuenta. Cada gesto de solidaridad ayuda a combatir los incendios que devastan nuestra Patagonia.
              </p>

              <p className="text-lg text-orange-200 mb-12 font-medium">
                Miles de familias necesitan tu ayuda ahora mismo.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/puntos-donacion" className="group relative overflow-hidden flex min-w-[280px] cursor-pointer items-center justify-center rounded-2xl h-20 px-12 bg-gradient-to-r from-orange-500 via-red-600 to-red-700 text-white text-xl font-black shadow-2xl shadow-red-600/40 hover:shadow-orange-500/60 transition-all duration-300 transform hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">🔥 Empezar a Ayudar Ahora</span>
                </Link>

                <Link href="/registrar-centro" className="flex min-w-[280px] cursor-pointer items-center justify-center rounded-2xl h-20 px-12 border-2 border-orange-400/60 bg-orange-500/10 backdrop-blur-sm text-orange-200 text-xl font-bold hover:bg-orange-500/20 hover:border-orange-400 transition-all duration-300 transform hover:scale-105">
                  <span>Registrar Centro de Donación</span>
                </Link>
              </div>

              {/* Commitment statement */}
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
                  <p className="text-lg text-orange-200 font-medium leading-relaxed">
                    <span className="text-orange-300 font-bold">Tu ayuda llegará donde más se necesite.</span><br />
                    Trabajamos con organizaciones locales para garantizar que cada donación tenga el máximo impacto.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-black border-t border-orange-500/20 px-4 py-16" id="recursos">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 text-orange-400">
              <span className="text-xl font-black text-white">Matafuego Solidario</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plataforma de emergencia dedicada a coordinar la ayuda solidaria para combatir los incendios forestales en Argentina.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h5 className="text-sm font-bold uppercase tracking-widest text-orange-300">Plataforma de Emergencia</h5>
            <nav className="flex flex-col gap-3">
              <Link href="/puntos-donacion" className="text-sm text-slate-300 hover:text-orange-400 transition-colors flex items-center gap-2">
                <span>🔍</span> Puntos de Donación
              </Link>
              <Link href="/registrar-centro" className="text-sm text-slate-300 hover:text-orange-400 transition-colors flex items-center gap-2">
                <span>➕</span> Registrar Punto
              </Link>
              <Link href="/incendios" className="text-sm text-slate-300 hover:text-orange-400 transition-colors flex items-center gap-2">
                <span>🔥</span> Mapa de Incendios
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <h5 className="text-sm font-bold uppercase tracking-widest text-red-300">Emergencias</h5>
            <nav className="flex flex-col gap-3">
              <a className="text-sm text-slate-300 hover:text-red-400 transition-colors flex items-center gap-2" href="tel:100">
                <span>🚨</span> Bomberos: 100
              </a>
              <a className="text-sm text-slate-300 hover:text-red-400 transition-colors flex items-center gap-2" href="tel:103">
                <span>🛡️</span> Defensa Civil: 103
              </a>
              <a className="text-sm text-slate-300 hover:text-red-400 transition-colors flex items-center gap-2" href="tel:911">
                <span>📞</span> Emergencias: 911
              </a>
            </nav>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-orange-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © 2025 Matafuego Solidario. Desarrollado con urgencia para la Patagonia en crisis.
          </p>
        </div>
      </footer>
    </div>
  );
}
