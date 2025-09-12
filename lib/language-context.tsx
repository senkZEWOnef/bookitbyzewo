'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation object
const translations = {
  en: {
    // Navigation
    'nav.pricing': 'Pricing',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    
    // Homepage Hero
    'hero.badge': 'WhatsApp-First Booking System',
    'hero.title': 'A Calendly built for',
    'hero.subtitle': 'Service professionals get a shareable booking link that confirms appointments, collects deposits, and sends updates via WhatsApp. Bilingual (EN/ES), PR-friendly (Stripe + ATH Móvil).',
    'hero.cta.trial': 'Start Free Trial',
    'hero.cta.demo': 'See Live Demo',
    
    // Stats Section
    'stats.noshows.number': '87%',
    'stats.noshows.label': 'Reduction in No-Shows',
    'stats.noshows.desc': 'Deposits and WhatsApp reminders eliminate empty slots',
    'stats.whatsapp.number': '2B+',
    'stats.whatsapp.label': 'WhatsApp Users Worldwide',
    'stats.setup.number': '5min',
    'stats.setup.label': 'Average Setup Time',
    'stats.automation.number': '24/7',
    'stats.automation.label': 'Automated Booking',
    'stats.time.number': '12hrs',
    'stats.time.label': 'Saved Per Week',
    'stats.time.desc': 'Automated booking and confirmation process',
    'stats.revenue.number': '+43%',
    'stats.revenue.label': 'Revenue Increase',
    'stats.revenue.desc': 'More bookings, fewer cancellations, guaranteed deposits',
    
    // Features Section
    'features.title': 'Built for Puerto Rico Service Professionals',
    'features.subtitle': 'Everything you need to automate bookings, eliminate no-shows, and get paid faster.',
    
    'features.whatsapp.title': 'Native WhatsApp Integration',
    'features.whatsapp.desc': 'Customers book, get confirmed, and receive reminders all through WhatsApp - where they already are.',
    
    'features.deposits.title': 'Smart Deposit Protection',
    'features.deposits.desc': 'Require deposits via Stripe or ATH Móvil. No more driving to empty appointments.',
    
    'features.bilingual.title': 'Fully Bilingual (EN/ES)',
    'features.bilingual.desc': 'Automatic language detection based on customer preference. Perfect for Puerto Rico.',
    
    'features.calendar.title': 'Real-Time Availability',
    'features.calendar.desc': 'Sync with Google Calendar. Customers see only your actual available time slots.',
    
    'features.payments.title': 'Local Payment Methods',
    'features.payments.desc': 'Accept Stripe (cards) and ATH Móvil for maximum convenience in Puerto Rico.',
    
    'features.automation.title': 'Complete Automation',
    'features.automation.desc': 'Booking confirmations, reminders, and payment processing - all handled automatically.',
    
    // Testimonials
    'testimonials.title': 'Trusted by Puerto Rico Professionals',
    'testimonials.maria.quote': 'Before BookIt, I was losing 3-4 appointments per week to no-shows. Now with deposits and WhatsApp reminders, it\'s down to maybe 1 per month!',
    'testimonials.clean.quote': 'My customers love booking through WhatsApp. The deposit feature means I never waste time driving to empty houses anymore. Game changer!',
    'testimonials.tutor.quote': 'My students and their parents are always on WhatsApp. Having everything automated there saves me hours every week. Super easy setup too!',
    
    // CTA Section
    'cta.title': 'Ready to Stop Chasing Customers?',
    'cta.subtitle': 'Join hundreds of service providers who\'ve eliminated no-shows and automated their booking process with WhatsApp. Start your free trial today.',
    'cta.trial': 'Start Free 30-Day Trial',
    'cta.pricing': 'View Pricing',
    'cta.features.setup': 'Setup in 5 minutes',
    'cta.features.nocard': 'No credit card required',
    'cta.features.support': 'Free onboarding support',
    
    // Footer
    'footer.copyright': '© 2024 BookIt by Zewo. WhatsApp-first booking for service pros.',
    
    // Auth Pages
    'auth.login.title': 'Welcome Back',
    'auth.login.subtitle': 'Sign in to your BookIt account',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Sign In',
    'auth.login.forgot': 'Forgot your password?',
    'auth.login.signup': 'Don\'t have an account? Sign up',
    
    'auth.signup.title': 'Start Your Free Trial',
    'auth.signup.subtitle': 'Create your BookIt account and eliminate no-shows today',
    'auth.signup.name': 'Full Name',
    'auth.signup.email': 'Email',
    'auth.signup.password': 'Password',
    'auth.signup.phone': 'Phone Number',
    'auth.signup.submit': 'Create Account',
    'auth.signup.login': 'Already have an account? Sign in',
    'auth.signup.terms': 'By signing up, you agree to our Terms of Service and Privacy Policy',
    'auth.signup.confirm': 'Confirm Password',
    'auth.signup.creating': 'Creating Account...',

    // Features for Service Providers
    'providers.title': 'Perfect for Local Service Providers',
    'providers.subtitle': 'Built specifically for businesses that live in WhatsApp and need to eliminate no-shows',
    
    'providers.beauty.title': 'Barbers & Beauty',
    'providers.beauty.desc': 'Hair salons, nail techs, lash artists. Live in WhatsApp/Instagram and hate no-shows. Get deposits upfront and automatic reminders.',
    'providers.beauty.tags': 'Hair Salons,Nail Studios,Lash Artists',
    
    'providers.home.title': 'Home Services', 
    'providers.home.desc': 'Cleaners, handymen, car detailers, movers. Need deposits and route planning. No more manual DMs or double-booking chaos.',
    'providers.home.tags': 'Cleaning,Handyman,Car Detailing',
    
    'providers.personal.title': 'Personal Services',
    'providers.personal.desc': 'Tutors, personal trainers, coaches, therapists. Reschedules and reminders matter. Small clinics where assistants run everything on WhatsApp.',
    'providers.personal.tags': 'Tutoring,Personal Training,Therapy',

    // How It Works
    'howit.title': 'How It Works',
    'howit.subtitle': 'Simple 3-step process that eliminates booking friction',
    
    'howit.step1.title': 'Customer Opens Your Link',
    'howit.step1.desc': 'Share your booking page via WhatsApp, Instagram bio, or QR code. Works perfectly on mobile phones.',
    
    'howit.step2.title': 'Pick Service, Time & Pay Deposit',
    'howit.step2.desc': 'One-tap booking: choose service → see real-time availability → pay deposit (Stripe/ATH) → done in 30 seconds.',
    
    'howit.step3.title': 'Automatic WhatsApp Updates',
    'howit.step3.desc': 'Instant confirmation + calendar link. Reminders 24h & 2h before. Self-serve reschedule/cancel links. No manual messaging needed.',
    
    'howit.integration.title': 'WhatsApp Integration',
    'howit.integration.desc': 'All communications happen where your customers already are - WhatsApp. No app downloads, no new accounts, no friction.',
    'howit.integration.tags': 'Confirmations,Reminders,Updates',

    // Why Choose Us
    'whychoose.title': 'Why Choose BookIt by Zewo?',
    'whychoose.subtitle': 'Built specifically for WhatsApp-first businesses in Puerto Rico and Hispanic markets',
    
    'whychoose.native.title': 'WhatsApp-Native',
    'whychoose.native.desc': 'Not just another booking tool. Built specifically for WhatsApp communication with native message templates and links.',
    
    'whychoose.protection.title': 'No-Show Protection',
    'whychoose.protection.desc': 'Collect deposits upfront with Stripe or ATH Móvil. Set custom no-show policies per service to protect your time.',
    
    'whychoose.bilingual.title': 'Bilingual Ready',
    'whychoose.bilingual.desc': 'English and Spanish templates built-in. Perfect for Puerto Rico and US Hispanic markets. Not an afterthought.',
    
    'whychoose.mobile.title': 'Mobile-First',
    'whychoose.mobile.desc': 'One-tap booking flow optimized for mobile. Works perfectly on phones without any app downloads.',

    // Pricing Page
    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.subtitle': 'Choose Your Perfect Plan',
    'pricing.hero.description': 'All plans include a 30-day free trial. No setup fees, no hidden costs, cancel anytime. Start eliminating no-shows today.',
    'pricing.hero.trial': '30-day free trial',
    'pricing.hero.setup': 'No setup fees',
    'pricing.hero.cancel': 'Cancel anytime',
    'pricing.plan.solo.name': 'Solo',
    'pricing.plan.solo.desc': 'Perfect for individual service providers',
    'pricing.plan.team.name': 'Team', 
    'pricing.plan.team.desc': 'Great for small teams and multiple locations',
    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.pro.desc': 'Full-featured solution for growing businesses',
    'pricing.cta': 'Start Free Trial',
    'pricing.popular': 'Most Popular',
    'pricing.features.title': 'Complete Feature Comparison',
    'pricing.features.subtitle': 'Everything you need to know about what\'s included in each plan',
    'pricing.faq.title': 'Frequently Asked Questions',
    'pricing.faq.subtitle': 'Everything you need to know about BookIt by Zewo',
    'pricing.final.title': 'Ready to Transform Your Business?',
    'pricing.final.subtitle': 'Join hundreds of service providers who\'ve eliminated no-shows and automated their booking process with WhatsApp. Start your journey today.',
    'pricing.final.trial': 'Start Your Free Trial',
    'pricing.final.demo': 'Book a Demo',
    'pricing.final.security': 'Your data is secure and protected. We never share your information.',
    
    // Plan features
    'pricing.features.staff_one': '1 staff member',
    'pricing.features.staff_five': 'Up to 5 staff members', 
    'pricing.features.staff_ten': 'Up to 10 staff members',
    'pricing.features.location_one': '1 location',
    'pricing.features.location_multiple': 'Multiple locations',
    'pricing.features.bookings': 'Unlimited bookings',
    'pricing.features.whatsapp_manual': 'WhatsApp manual mode',
    'pricing.features.whatsapp_auto': 'Automated WhatsApp messages',
    'pricing.features.payments': 'Stripe + ATH Móvil payments',
    'pricing.features.bilingual': 'Bilingual templates (EN/ES)',
    'pricing.features.calendar_basic': 'Basic calendar view',
    'pricing.features.calendar_advanced': 'Advanced calendar views',
    'pricing.features.scheduling': 'Staff scheduling',
    'pricing.features.customers': 'Customer management',
    'pricing.features.reports_basic': 'Basic reports',
    'pricing.features.reports_advanced': 'Advanced analytics',
    'pricing.features.domains': 'Custom booking domains',
    'pricing.features.api': 'API access',
    'pricing.features.integrations': 'Custom integrations',
    'pricing.features.everything_solo': 'Everything in Solo',
    'pricing.features.everything_team': 'Everything in Team',
    'pricing.features.support_email': 'Email support',
    'pricing.features.support_priority': 'Priority email support',
    'pricing.features.support_phone': 'Phone + email support',
    
    // Feature comparison table
    'pricing.table.features': 'Features',
    'pricing.table.solo': 'Solo',
    'pricing.table.team': 'Team',
    'pricing.table.pro': 'Pro',
    'pricing.table.popular': 'Popular',
    'pricing.table.staff_members': 'Staff Members',
    'pricing.table.locations': 'Locations',
    'pricing.table.whatsapp_integration': 'WhatsApp Integration',
    'pricing.table.payment_processing': 'Payment Processing',
    'pricing.table.bilingual_support': 'Bilingual Support (EN/ES)',
    'pricing.table.calendar_sync': 'Calendar Sync',
    'pricing.table.advanced_reports': 'Advanced Reports',
    'pricing.table.custom_domain': 'Custom Domain',
    'pricing.table.api_access': 'API Access',
    'pricing.table.support': 'Support',
    'pricing.table.manual': 'Manual',
    'pricing.table.automated': 'Automated',
    'pricing.table.basic': 'Basic',
    'pricing.table.advanced': 'Advanced',
    'pricing.table.multiple': 'Multiple',
    'pricing.table.unlimited': 'Unlimited',
    'pricing.table.email': 'Email',
    'pricing.table.priority_email': 'Priority Email',
    'pricing.table.phone_email': 'Phone + Email',
    'pricing.table.up_to': 'Up to',
    'pricing.table.up_to_5': 'Up to 5',
    'pricing.table.up_to_10': 'Up to 10',
    
    // FAQ
    'pricing.faq.trial.question': 'Is there really a free trial?',
    'pricing.faq.trial.answer': 'Yes! All plans include a full 30-day free trial with access to all features. No credit card required to start. We believe in our product and want you to experience the difference it makes.',
    'pricing.faq.payment.question': 'What payment methods do you accept?',
    'pricing.faq.payment.answer': 'We accept all major credit cards through Stripe, and ATH Móvil for Puerto Rico customers. Your customers can pay deposits using the same methods. We handle all the payment processing securely.',
    'pricing.faq.change.question': 'Can I change plans later?',
    'pricing.faq.change.answer': 'Absolutely! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately, and we\'ll prorate the billing accordingly. No penalties or fees.',
    'pricing.faq.fees.question': 'Do you charge transaction fees?',
    'pricing.faq.fees.answer': 'We don\'t charge any additional transaction fees beyond our subscription price. You\'ll only pay standard Stripe processing fees (2.9% + 30¢) for credit card payments. ATH Móvil transactions have no additional fees.',
    'pricing.faq.cancel.question': 'What happens if I cancel?',
    'pricing.faq.cancel.answer': 'You can cancel anytime with no penalty or cancellation fees. Your account remains active until the end of your billing period, and you can export all your data including customer information and appointment history.',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
  },
  es: {
    // Navigation
    'nav.pricing': 'Precios',
    'nav.login': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    
    // Homepage Hero
    'hero.badge': 'Sistema de Reservas por WhatsApp',
    'hero.title': 'Un Calendly diseñado para',
    'hero.subtitle': 'Los profesionales de servicios obtienen un enlace compartible que confirma citas, cobra depósitos y envía actualizaciones por WhatsApp. Bilingüe (EN/ES), amigable para PR (Stripe + ATH Móvil).',
    'hero.cta.trial': 'Comenzar Prueba Gratis',
    'hero.cta.demo': 'Ver Demo en Vivo',
    
    // Stats Section
    'stats.noshows.number': '87%',
    'stats.noshows.label': 'Reducción en Ausencias',
    'stats.noshows.desc': 'Depósitos y recordatorios de WhatsApp eliminan las citas vacías',
    'stats.whatsapp.number': '2B+',
    'stats.whatsapp.label': 'Usuarios de WhatsApp Mundialmente',
    'stats.setup.number': '5min',
    'stats.setup.label': 'Tiempo Promedio de Configuración',
    'stats.automation.number': '24/7',
    'stats.automation.label': 'Reservas Automatizadas',
    'stats.time.number': '12hrs',
    'stats.time.label': 'Ahorradas por Semana',
    'stats.time.desc': 'Proceso automatizado de reservas y confirmaciones',
    'stats.revenue.number': '+43%',
    'stats.revenue.label': 'Aumento en Ingresos',
    'stats.revenue.desc': 'Más reservas, menos cancelaciones, depósitos garantizados',
    
    // Features Section
    'features.title': 'Creado para Profesionales de Servicios en Puerto Rico',
    'features.subtitle': 'Todo lo que necesitas para automatizar reservas, eliminar ausencias y cobrar más rápido.',
    
    'features.whatsapp.title': 'Integración Nativa con WhatsApp',
    'features.whatsapp.desc': 'Los clientes reservan, reciben confirmación y recordatorios todo por WhatsApp - donde ya están.',
    
    'features.deposits.title': 'Protección Inteligente de Depósitos',
    'features.deposits.desc': 'Requiere depósitos vía Stripe o ATH Móvil. No más manejar a citas vacías.',
    
    'features.bilingual.title': 'Completamente Bilingüe (EN/ES)',
    'features.bilingual.desc': 'Detección automática de idioma basada en la preferencia del cliente. Perfecto para Puerto Rico.',
    
    'features.calendar.title': 'Disponibilidad en Tiempo Real',
    'features.calendar.desc': 'Sincroniza con Google Calendar. Los clientes ven solo tus horarios realmente disponibles.',
    
    'features.payments.title': 'Métodos de Pago Locales',
    'features.payments.desc': 'Acepta Stripe (tarjetas) y ATH Móvil para máxima conveniencia en Puerto Rico.',
    
    'features.automation.title': 'Automatización Completa',
    'features.automation.desc': 'Confirmaciones de reservas, recordatorios y procesamiento de pagos - todo manejado automáticamente.',
    
    // Testimonials
    'testimonials.title': 'Confiado por Profesionales de Puerto Rico',
    'testimonials.maria.quote': '¡Antes de BookIt, perdía 3-4 citas por semana por ausencias. Ahora con depósitos y recordatorios de WhatsApp, es quizás 1 por mes!',
    'testimonials.clean.quote': '¡A mis clientes les encanta reservar por WhatsApp. La función de depósito significa que nunca pierdo tiempo manejando a casas vacías. Un cambio total!',
    'testimonials.tutor.quote': 'Mis estudiantes y sus padres siempre están en WhatsApp. Tener todo automatizado ahí me ahorra horas cada semana. ¡Súper fácil de configurar también!',
    
    // CTA Section
    'cta.title': '¿Listo para Dejar de Perseguir Clientes?',
    'cta.subtitle': 'Únete a cientos de proveedores de servicios que han eliminado las ausencias y automatizado su proceso de reservas con WhatsApp. Comienza tu prueba gratis hoy.',
    'cta.trial': 'Comenzar Prueba Gratis de 30 Días',
    'cta.pricing': 'Ver Precios',
    'cta.features.setup': 'Configuración en 5 minutos',
    'cta.features.nocard': 'No se requiere tarjeta de crédito',
    'cta.features.support': 'Soporte gratuito de configuración',
    
    // Footer
    'footer.copyright': '© 2024 BookIt by Zewo. Reservas por WhatsApp para profesionales de servicios.',
    
    // Auth Pages
    'auth.login.title': 'Bienvenido de Vuelta',
    'auth.login.subtitle': 'Inicia sesión en tu cuenta de BookIt',
    'auth.login.email': 'Correo Electrónico',
    'auth.login.password': 'Contraseña',
    'auth.login.submit': 'Iniciar Sesión',
    'auth.login.forgot': '¿Olvidaste tu contraseña?',
    'auth.login.signup': '¿No tienes cuenta? Regístrate',
    
    'auth.signup.title': 'Comienza tu Prueba Gratis',
    'auth.signup.subtitle': 'Crea tu cuenta de BookIt y elimina las ausencias hoy',
    'auth.signup.name': 'Nombre Completo',
    'auth.signup.email': 'Correo Electrónico',
    'auth.signup.password': 'Contraseña',
    'auth.signup.phone': 'Número de Teléfono',
    'auth.signup.submit': 'Crear Cuenta',
    'auth.signup.login': '¿Ya tienes cuenta? Inicia sesión',
    'auth.signup.terms': 'Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad',
    'auth.signup.confirm': 'Confirmar Contraseña',
    'auth.signup.creating': 'Creando Cuenta...',

    // Features for Service Providers
    'providers.title': 'Perfecto para Proveedores de Servicios Locales',
    'providers.subtitle': 'Construido específicamente para empresas que viven en WhatsApp y necesitan eliminar ausencias',
    
    'providers.beauty.title': 'Peluqueros y Belleza',
    'providers.beauty.desc': 'Salones de cabello, técnicos de uñas, artistas de pestañas. Viven en WhatsApp/Instagram y odian las ausencias. Obtén depósitos por adelantado y recordatorios automáticos.',
    'providers.beauty.tags': 'Salones de Cabello,Estudios de Uñas,Artistas de Pestañas',
    
    'providers.home.title': 'Servicios del Hogar', 
    'providers.home.desc': 'Limpiadores, handymen, detailing de autos, mudanzas. Necesitan depósitos y planificación de rutas. No más DMs manuales o caos de doble reserva.',
    'providers.home.tags': 'Limpieza,Handyman,Detailing de Autos',
    
    'providers.personal.title': 'Servicios Personales',
    'providers.personal.desc': 'Tutores, entrenadores personales, coaches, terapeutas. Las reprogramaciones y recordatorios importan. Clínicas pequeñas donde los asistentes manejan todo por WhatsApp.',
    'providers.personal.tags': 'Tutoría,Entrenamiento Personal,Terapia',

    // How It Works
    'howit.title': 'Cómo Funciona',
    'howit.subtitle': 'Proceso simple de 3 pasos que elimina la fricción de reservas',
    
    'howit.step1.title': 'Cliente Abre tu Enlace',
    'howit.step1.desc': 'Comparte tu página de reservas por WhatsApp, bio de Instagram o código QR. Funciona perfectamente en teléfonos móviles.',
    
    'howit.step2.title': 'Elige Servicio, Hora y Paga Depósito',
    'howit.step2.desc': 'Reserva de un toque: elige servicio → ve disponibilidad en tiempo real → paga depósito (Stripe/ATH) → listo en 30 segundos.',
    
    'howit.step3.title': 'Actualizaciones Automáticas de WhatsApp',
    'howit.step3.desc': 'Confirmación instantánea + enlace de calendario. Recordatorios 24h y 2h antes. Enlaces de reprogramación/cancelación autoservicio. No se necesita mensajería manual.',
    
    'howit.integration.title': 'Integración con WhatsApp',
    'howit.integration.desc': 'Todas las comunicaciones ocurren donde tus clientes ya están - WhatsApp. Sin descargas de apps, sin cuentas nuevas, sin fricción.',
    'howit.integration.tags': 'Confirmaciones,Recordatorios,Actualizaciones',

    // Why Choose Us
    'whychoose.title': '¿Por Qué Elegir BookIt by Zewo?',
    'whychoose.subtitle': 'Construido específicamente para empresas que priorizan WhatsApp en Puerto Rico y mercados hispanos',
    
    'whychoose.native.title': 'Nativo de WhatsApp',
    'whychoose.native.desc': 'No solo otra herramienta de reservas. Construido específicamente para comunicación de WhatsApp con plantillas de mensajes nativos y enlaces.',
    
    'whychoose.protection.title': 'Protección contra Ausencias',
    'whychoose.protection.desc': 'Cobra depósitos por adelantado con Stripe o ATH Móvil. Establece políticas personalizadas de ausencias por servicio para proteger tu tiempo.',
    
    'whychoose.bilingual.title': 'Listo para Bilingüe',
    'whychoose.bilingual.desc': 'Plantillas en inglés y español incorporadas. Perfecto para Puerto Rico y mercados hispanos de EE.UU. No es una idea tardía.',
    
    'whychoose.mobile.title': 'Móvil Primero',
    'whychoose.mobile.desc': 'Flujo de reserva de un toque optimizado para móvil. Funciona perfectamente en teléfonos sin descargas de apps.',

    // Pricing Page
    'pricing.title': 'Precios Simples y Transparentes',
    'pricing.subtitle': 'Elige Tu Plan Perfecto',
    'pricing.hero.description': 'Todos los planes incluyen una prueba gratuita de 30 días. Sin tarifas de configuración, sin costos ocultos, cancela en cualquier momento. Comienza a eliminar ausencias hoy.',
    'pricing.hero.trial': 'Prueba gratuita de 30 días',
    'pricing.hero.setup': 'Sin tarifas de configuración',
    'pricing.hero.cancel': 'Cancela en cualquier momento',
    'pricing.plan.solo.name': 'Solo',
    'pricing.plan.solo.desc': 'Perfecto para proveedores de servicios individuales',
    'pricing.plan.team.name': 'Equipo', 
    'pricing.plan.team.desc': 'Excelente para equipos pequeños y múltiples ubicaciones',
    'pricing.plan.pro.name': 'Pro',
    'pricing.plan.pro.desc': 'Solución completa para empresas en crecimiento',
    'pricing.cta': 'Comenzar Prueba Gratis',
    'pricing.popular': 'Más Popular',
    'pricing.features.title': 'Comparación Completa de Características',
    'pricing.features.subtitle': 'Todo lo que necesitas saber sobre lo que se incluye en cada plan',
    'pricing.faq.title': 'Preguntas Frecuentes',
    'pricing.faq.subtitle': 'Todo lo que necesitas saber sobre BookIt by Zewo',
    'pricing.final.title': '¿Listo para Transformar tu Negocio?',
    'pricing.final.subtitle': 'Únete a cientos de proveedores de servicios que han eliminado las ausencias y automatizado su proceso de reservas con WhatsApp. Comienza tu viaje hoy.',
    'pricing.final.trial': 'Comienza tu Prueba Gratis',
    'pricing.final.demo': 'Reservar una Demo',
    'pricing.final.security': 'Tus datos están seguros y protegidos. Nunca compartimos tu información.',
    
    // Plan features
    'pricing.features.staff_one': '1 miembro del personal',
    'pricing.features.staff_five': 'Hasta 5 miembros del personal',
    'pricing.features.staff_ten': 'Hasta 10 miembros del personal',
    'pricing.features.location_one': '1 ubicación',
    'pricing.features.location_multiple': 'Múltiples ubicaciones',
    'pricing.features.bookings': 'Reservas ilimitadas',
    'pricing.features.whatsapp_manual': 'Modo manual de WhatsApp',
    'pricing.features.whatsapp_auto': 'Mensajes automáticos de WhatsApp',
    'pricing.features.payments': 'Pagos con Stripe + ATH Móvil',
    'pricing.features.bilingual': 'Plantillas bilingües (EN/ES)',
    'pricing.features.calendar_basic': 'Vista básica del calendario',
    'pricing.features.calendar_advanced': 'Vistas avanzadas del calendario',
    'pricing.features.scheduling': 'Programación del personal',
    'pricing.features.customers': 'Gestión de clientes',
    'pricing.features.reports_basic': 'Reportes básicos',
    'pricing.features.reports_advanced': 'Análisis avanzados',
    'pricing.features.domains': 'Dominios de reserva personalizados',
    'pricing.features.api': 'Acceso a API',
    'pricing.features.integrations': 'Integraciones personalizadas',
    'pricing.features.everything_solo': 'Todo en Solo',
    'pricing.features.everything_team': 'Todo en Equipo',
    'pricing.features.support_email': 'Soporte por correo',
    'pricing.features.support_priority': 'Soporte prioritario por correo',
    'pricing.features.support_phone': 'Soporte telefónico + correo',
    
    // Feature comparison table
    'pricing.table.features': 'Características',
    'pricing.table.solo': 'Solo',
    'pricing.table.team': 'Equipo',
    'pricing.table.pro': 'Pro',
    'pricing.table.popular': 'Popular',
    'pricing.table.staff_members': 'Miembros del Personal',
    'pricing.table.locations': 'Ubicaciones',
    'pricing.table.whatsapp_integration': 'Integración de WhatsApp',
    'pricing.table.payment_processing': 'Procesamiento de Pagos',
    'pricing.table.bilingual_support': 'Soporte Bilingüe (EN/ES)',
    'pricing.table.calendar_sync': 'Sincronización de Calendario',
    'pricing.table.advanced_reports': 'Reportes Avanzados',
    'pricing.table.custom_domain': 'Dominio Personalizado',
    'pricing.table.api_access': 'Acceso a API',
    'pricing.table.support': 'Soporte',
    'pricing.table.manual': 'Manual',
    'pricing.table.automated': 'Automatizado',
    'pricing.table.basic': 'Básico',
    'pricing.table.advanced': 'Avanzado',
    'pricing.table.multiple': 'Múltiples',
    'pricing.table.unlimited': 'Ilimitadas',
    'pricing.table.email': 'Correo',
    'pricing.table.priority_email': 'Correo Prioritario',
    'pricing.table.phone_email': 'Teléfono + Correo',
    'pricing.table.up_to': 'Hasta',
    'pricing.table.up_to_5': 'Hasta 5',
    'pricing.table.up_to_10': 'Hasta 10',
    
    // FAQ
    'pricing.faq.trial.question': '¿Realmente hay una prueba gratuita?',
    'pricing.faq.trial.answer': '¡Sí! Todos los planes incluyen una prueba gratuita completa de 30 días con acceso a todas las funciones. No se requiere tarjeta de crédito para comenzar. Creemos en nuestro producto y queremos que experimentes la diferencia que hace.',
    'pricing.faq.payment.question': '¿Qué métodos de pago aceptan?',
    'pricing.faq.payment.answer': 'Aceptamos todas las principales tarjetas de crédito a través de Stripe, y ATH Móvil para clientes de Puerto Rico. Tus clientes pueden pagar depósitos usando los mismos métodos. Manejamos todo el procesamiento de pagos de forma segura.',
    'pricing.faq.change.question': '¿Puedo cambiar de plan más tarde?',
    'pricing.faq.change.answer': '¡Absolutamente! Puedes actualizar o cambiar a un plan inferior en cualquier momento desde tu panel de control. Los cambios surten efecto inmediatamente, y prorratearemos la facturación en consecuencia. Sin penalizaciones ni tarifas.',
    'pricing.faq.fees.question': '¿Cobran tarifas de transacción?',
    'pricing.faq.fees.answer': 'No cobramos tarifas de transacción adicionales más allá del precio de nuestra suscripción. Solo pagarás las tarifas estándar de procesamiento de Stripe (2.9% + 30¢) para pagos con tarjeta de crédito. Las transacciones de ATH Móvil no tienen tarifas adicionales.',
    'pricing.faq.cancel.question': '¿Qué pasa si cancelo?',
    'pricing.faq.cancel.answer': 'Puedes cancelar en cualquier momento sin penalización ni tarifas de cancelación. Tu cuenta permanece activa hasta el final de tu período de facturación, y puedes exportar todos tus datos incluyendo información de clientes e historial de citas.',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.success': '¡Éxito!',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('es') // Default to Spanish for PR

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('bookitLanguage') as Language
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguage(saved)
    }
  }, [])

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('bookitLanguage', lang)
  }

  // Translation function
  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations.en]
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`)
      return key // Return key if translation missing
    }
    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}