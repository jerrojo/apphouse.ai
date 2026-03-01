// =============================================================================
// Pipeline setup — tooling bootstrapped per app creation
// =============================================================================

export interface PipelineTooling {
  id: string;
  name: string;
  category: 'framework' | 'platform' | 'security' | 'design' | 'ar-vr' | 'infra';
  description: string;
  setupCommand?: string;
  requiredEnvVars?: string[];
}

// Every time an app is created, these tools are bootstrapped
export const PIPELINE_TOOLING: PipelineTooling[] = [
  // ── Frameworks ────────────────────────────────────────────────────
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    description: 'React meta-framework for web apps with SSR, API routes, and edge functions',
    setupCommand: 'npx create-next-app@latest --typescript --tailwind --app --use-npm',
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'framework',
    description: 'Fast build tool for lightweight SPAs and PWAs',
    setupCommand: 'npm create vite@latest -- --template react-ts',
  },

  // ── Mobile platforms ──────────────────────────────────────────────
  {
    id: 'ios',
    name: 'iOS (React Native)',
    category: 'platform',
    description: 'Native iOS app via React Native with Expo',
    setupCommand: 'npx create-expo-app --template tabs',
  },
  {
    id: 'android',
    name: 'Android (React Native)',
    category: 'platform',
    description: 'Native Android app via React Native with Expo',
    setupCommand: 'npx create-expo-app --template tabs',
  },

  // ── Security ──────────────────────────────────────────────────────
  {
    id: 'arcjet',
    name: 'Arcjet',
    category: 'security',
    description: 'Rate limiting, bot protection, and security middleware',
    setupCommand: 'npm install @arcjet/next',
    requiredEnvVars: ['ARCJET_KEY'],
  },

  // ── AR / VR / 3D ─────────────────────────────────────────────────
  {
    id: 'arcore-unity',
    name: 'ARCore + Unity',
    category: 'ar-vr',
    description: 'Augmented reality experiences via Unity with ARCore/ARKit',
  },
  {
    id: 'arcore-vanilla',
    name: 'ARCore + Vanilla JS',
    category: 'ar-vr',
    description: 'Web-based AR using WebXR and Three.js',
    setupCommand: 'npm install three @types/three',
  },

  // ── Design ────────────────────────────────────────────────────────
  {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    description: 'Create a Figma file with all app screens for direct user editing',
    requiredEnvVars: ['FIGMA_ACCESS_TOKEN'],
  },

  // ── Infrastructure ────────────────────────────────────────────────
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'infra',
    description: 'Postgres database, auth, storage, and realtime',
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'infra',
    description: 'Hosting, CI/CD, edge functions, and preview deployments',
    requiredEnvVars: ['VERCEL_TOKEN'],
  },
];

// Returns which tools to bootstrap based on selected platforms
export function getToolingForPlatforms(platforms: {
  web: boolean;
  ios: boolean;
  android: boolean;
}): PipelineTooling[] {
  const tools: PipelineTooling[] = [];

  // Always included
  tools.push(
    ...PIPELINE_TOOLING.filter(t => ['supabase', 'vercel', 'arcjet', 'figma'].includes(t.id))
  );

  if (platforms.web) {
    tools.push(...PIPELINE_TOOLING.filter(t => ['nextjs', 'vite'].includes(t.id)));
  }

  if (platforms.ios) {
    tools.push(...PIPELINE_TOOLING.filter(t => t.id === 'ios'));
  }

  if (platforms.android) {
    tools.push(...PIPELINE_TOOLING.filter(t => t.id === 'android'));
  }

  return tools;
}

// Human-readable summary of the tooling stack
export function describeToolingStack(tools: PipelineTooling[]): string {
  const grouped = tools.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t.name);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped)
    .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
    .join(' | ');
}
