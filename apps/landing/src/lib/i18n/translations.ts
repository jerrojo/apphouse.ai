// =============================================================================
// All UI strings — Spanish (es) and English (en)
// =============================================================================

export type Locale = 'es' | 'en';

const translations = {
  // ── Login page ────────────────────────────────────────────────────
  login: {
    welcome: { es: 'bienvenido a apphouse', en: 'welcome to apphouse' },
    subtitle: {
      es: 'ingresa tu teléfono para entrar o crear tu cuenta',
      en: 'enter your phone to sign in or create an account',
    },
    phoneLabel: { es: 'teléfono', en: 'phone number' },
    phonePlaceholder: { es: '+521234567890', en: '+11234567890' },
    phoneError: {
      es: 'ingresa tu teléfono con código de país (ej. +521234567890)',
      en: 'enter your phone with country code (e.g. +11234567890)',
    },
    continue: { es: 'continuar', en: 'continue' },
    checking: { es: 'verificando...', en: 'checking...' },

    // OTP step
    verifyTitle: { es: 'verifica tu teléfono', en: 'verify your phone' },
    verifySent: { es: 'enviamos un código de 4 dígitos a', en: 'we sent a 4-digit code to' },
    otpError: { es: 'ingresa el código de 4 dígitos', en: 'enter the 4-digit code' },
    verify: { es: 'verificar', en: 'verify' },
    verifying: { es: 'verificando...', en: 'verifying...' },
    invalidCode: { es: 'código inválido', en: 'invalid code' },
    resendIn: { es: 'reenviar en', en: 'resend in' },
    resendCode: { es: 'reenviar código', en: 'resend code' },
    changeNumber: { es: '← cambiar número', en: '← change number' },
    resendFailed: { es: 'no se pudo reenviar', en: 'could not resend' },
    sendFailed: { es: 'no se pudo enviar el código', en: 'could not send code' },

    // PIN setup step
    pinSetupTitle: { es: 'crea tu nip', en: 'create your pin' },
    pinSetupSubtitle: {
      es: 'elige un nip de 4 dígitos para entrar la próxima vez — sin sms',
      en: 'choose a 4-digit pin to sign in next time — no sms needed',
    },
    pinLabel: { es: 'nip', en: 'pin' },
    pinConfirmLabel: { es: 'confirmar nip', en: 'confirm pin' },
    pinDigitsError: { es: 'el nip debe ser exactamente 4 dígitos', en: 'pin must be exactly 4 digits' },
    pinMismatch: { es: 'los nips no coinciden', en: 'pins don\'t match' },
    createAccount: { es: 'crear cuenta', en: 'create account' },
    creatingAccount: { es: 'creando cuenta...', en: 'creating account...' },
    registerFailed: { es: 'no se pudo crear la cuenta', en: 'could not create account' },

    // PIN login step
    welcomeBack: { es: 'hola de nuevo', en: 'welcome back' },
    enterPin: { es: 'ingresa tu nip para', en: 'enter your pin for' },
    pinError: { es: 'ingresa tu nip de 4 dígitos', en: 'enter your 4-digit pin' },
    wrongPin: { es: 'nip incorrecto', en: 'wrong pin' },
    signIn: { es: 'entrar', en: 'sign in' },
    signingIn: { es: 'entrando...', en: 'signing in...' },
    forgotPin: { es: 'olvidé mi nip', en: 'forgot pin?' },
  },

  // ── Homepage ──────────────────────────────────────────────────────
  home: {
    newApp: { es: 'nueva app', en: 'new app' },
    heroTitle1: { es: 'descríbelo.', en: 'describe it.' },
    heroTitle2: { es: 'lo construimos.', en: 'we build it.' },
    heroSubtitle: {
      es: 'fábrica de apps con ia. dinos qué necesitas, nuestros 10 agentes diseñan, construyen y publican tu app en web, ios y android.',
      en: 'ai-powered app factory. tell us what you need, our 10 agents design, build, and deploy your app to web, ios, and android.',
    },
    ctaCreate: { es: 'crea tu primera app', en: 'create your first app' },
    ctaHow: { es: 'cómo funciona', en: 'how it works' },
    ctaLogin: { es: 'inicia sesión para crear', en: 'sign in to create' },
    signIn: { es: 'entrar', en: 'sign in' },

    // How it works
    howTitle: { es: 'de idea a app store en minutos', en: 'from idea to app store in minutes' },
    step01Title: { es: 'describe', en: 'describe' },
    step01Text: {
      es: 'dinos qué quieres en palabras simples. nuestra ia hace preguntas inteligentes hasta entender tu visión.',
      en: 'tell us what you want in plain words. our ai asks smart questions until it fully understands your vision.',
    },
    step02Title: { es: 'cocinando', en: 'cooking' },
    step02Text: {
      es: '10 agentes especializados trabajan en secuencia: ux → wireframes → ui → dev → qa → data → ai → sales → cfo → pm.',
      en: '10 specialized agents work in sequence: ux → wireframes → ui → dev → qa → data → ai → sales → cfo → pm.',
    },
    step03Title: { es: 'refina', en: 'refine' },
    step03Text: {
      es: 'navega tu app en vivo y habla tus edits. la ia observa y escucha, luego actualiza en tiempo real.',
      en: 'navigate your live app and speak your edits. the ai watches and listens, then updates in real-time.',
    },
    step04Title: { es: 'publica', en: 'publish' },
    step04Text: {
      es: 'un click para enviar a app store y play store. tu app web sale al instante.',
      en: 'one click to submit to the app store and play store. your app goes live on web instantly.',
    },

    // App gallery
    yourApps: { es: 'tus apps', en: 'your apps' },
    noDescription: { es: 'sin descripción', en: 'no description yet' },
    createNew: { es: 'crear nueva app', en: 'create new app' },

    // Agents section
    agentsTitle: { es: '10 agentes. un pipeline.', en: '10 agents. one pipeline.' },
    agentsSubtitle: {
      es: 'cada agente es un especialista. juntos construyen apps completas.',
      en: 'each agent is a specialist. together they build complete apps.',
    },

    // Preview & Publish
    preview: { es: 'preview', en: 'preview' },
    publish: { es: 'publicar', en: 'publish' },
    published: { es: 'publicado', en: 'published' },
    viewLive: { es: 'ver en vivo', en: 'view live' },

    // Footer
    about: { es: 'acerca', en: 'about' },
    docs: { es: 'docs', en: 'docs' },
  },

  // ── Preview / Chat / Edit ──────────────────────────────────────────
  preview: {
    edit: { es: 'editar', en: 'edit' },
    editing: { es: 'editando', en: 'editing' },
    chatPlaceholder: { es: 'dile al PM qué cambiar...', en: 'tell the PM what to change...' },
    chatPlaceholderEdit: { es: 'describe el cambio en ese punto...', en: 'describe the change at that point...' },
    tapHint: { es: 'toca donde quieras hacer un cambio', en: 'tap where you want to make a change' },
    send: { es: 'enviar', en: 'send' },
    recording: { es: 'grabando...', en: 'recording...' },
    processing: { es: 'procesando...', en: 'processing...' },
  },

  // ── Profile ────────────────────────────────────────────────────────
  profile: {
    account: { es: 'cuenta', en: 'account' },
    signOut: { es: 'cerrar sesión', en: 'sign out' },
  },
} as const;

export default translations;
