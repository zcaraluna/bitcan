'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, BookOpen, Users, CheckCircle, TrendingUp, Clock, Globe, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { number: '50+', label: 'Estudiantes' },
    { number: '15+', label: 'Cursos' },
    { number: '90%', label: 'Satisfacción' },
    { number: '24/7', label: 'Soporte' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Expertos en Seguridad',
      description: 'Instructores certificados con años de experiencia en ciberseguridad, análisis forense y pentesting.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BookOpen,
      title: 'Contenido Actualizado',
      description: 'Cursos actualizados constantemente con las últimas tecnologías y metodologías del sector.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Únete a una comunidad de profesionales apasionados por la ciberseguridad.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: 'Aprendizaje Rápido',
      description: 'Metodología eficiente que te permite aprender habilidades prácticas en tiempo récord.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Target,
      title: 'Enfoque Práctico',
      description: 'Aprende haciendo con proyectos reales y casos de estudio del mundo empresarial.',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const benefits = [
    'Acceso de por vida a los cursos',
    'Certificados verificables digitalmente',
    'Soporte de instructores expertos',
    'Actualizaciones gratuitas del contenido',
    'Proyectos prácticos incluidos',
    'Comunidad de estudiantes activa',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header con efecto sticky */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/bitcan-logo.png"
              alt="BITCAN"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className={`text-xl font-bold transition-colors ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              BITCAN
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isScrolled 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isScrolled
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:shadow-lg'
                  : 'bg-white text-sky-600 hover:bg-gray-100'
              }`}
            >
              Comenzar
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center py-32">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
            Domina la
            <span className="block bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Ciberseguridad
            </span>
            con Expertos
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Aprende de los mejores profesionales. Cursos prácticos, certificaciones reconocidas 
            y una comunidad que te apoya en cada paso.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">BITCAN</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una plataforma diseñada para llevarte del principiante al experto en ciberseguridad
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-bl-full`}></div>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Todo lo que necesitas para
                <span className="block bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                  triunfar en ciberseguridad
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Nuestra plataforma te ofrece todas las herramientas y recursos necesarios 
                para desarrollar habilidades profesionales en ciberseguridad.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Estudiantes</div>
                      <div className="text-2xl font-bold text-gray-900">50+</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-sm text-gray-500">Cursos Completados</div>
                      <div className="text-xl font-bold text-gray-900">40+</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Certificados Emitidos</div>
                      <div className="text-xl font-bold text-gray-900">30+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para comenzar tu carrera en ciberseguridad?
          </h2>
          <p className="text-xl text-white/90">
            Únete a profesionales que ya están transformando sus carreras con BITCAN
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <Image
                  src="/bitcan-logo.png"
                  alt="BITCAN"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-xl font-bold text-white">BITCAN</span>
              </Link>
              <p className="text-sm text-gray-400 mb-4">
                Expertos en ciberseguridad y consultoría IT. Formando profesionales desde 2020.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Servicios</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Auditoría de Seguridad</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Análisis Forense</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pentesting</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Consultoría IT</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard_estudiante/explore" className="hover:text-white transition-colors">Cursos</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link href="/verificar_certificado" className="hover:text-white transition-colors">Verificar Certificado</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>Email:</span>
                  <a href="mailto:bitcan@bitcan.com.py" className="hover:text-white transition-colors">bitcan@bitcan.com.py</a>
                </li>
                <li>Asunción, Paraguay</li>
                <li className="flex items-center gap-2 mt-4">
                  <Clock className="w-4 h-4" />
                  <span>Soporte 24/7</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} BITCAN. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              <Link href="#" className="hover:text-white transition-colors">Política de Privacidad</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
