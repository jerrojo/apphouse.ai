# apphouse.ai — Quick Start (Terminal con Claude Code)

## Setup Inicial (una sola vez)

### Paso 1: Crear el monorepo
```bash
mkdir apphouse.ai && cd apphouse.ai
git init

# Copiar los archivos de configuración que ya tienes:
# - package.json (root)
# - turbo.json
# Luego:
npm install
```

### Paso 2: Crear estructura de carpetas
```bash
mkdir -p apps/_template/src/{app,components,lib}
mkdir -p apps/_template/public
mkdir -p apps/landing/src/{app,components,lib}
mkdir -p apps/landing/public
mkdir -p packages/{ui/src,supabase-client/src,config,utils/src}
mkdir -p supabase/migrations
mkdir -p scripts
```

### Paso 3: GitHub
```bash
# Crear org en GitHub (manual, una vez): github.com/organizations/new
# Nombre sugerido: apphouse-ai

gh repo create apphouse-ai/apphouse.ai --private --source=. --push
```

### Paso 4: Supabase
```bash
# Instalar CLI
npm install -g supabase

# Crear proyecto en https://supabase.com/dashboard
# Guardar: Project URL y anon key

supabase init
supabase link --project-ref TU_PROJECT_REF

# Copiar 001_core_schema.sql a supabase/migrations/
supabase db push
```

### Paso 5: Vercel
```bash
# Instalar CLI
npm install -g vercel

# Login
vercel login

# Para el landing (apphouse.ai):
cd apps/landing
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel domains add apphouse.ai
cd ../..
```

### Paso 6: GoDaddy DNS
```
Para apphouse.ai (ya lo tienes):
  - Tipo A: @ → 76.76.21.21 (Vercel)
  - Tipo CNAME: www → cname.vercel-dns.com
```

---

## Crear una Nueva App

```bash
# Con Claude Code en la terminal:
claude "Crea una nueva app en apphouse.ai llamada [nombre] que haga [descripción]"

# O manualmente:
chmod +x scripts/create-app.sh
./scripts/create-app.sh mi-app "Mi App" "miapp.com"

# Luego:
cd apps/mi-app
npm install
npx turbo dev --filter=mi-app

# Cuando esté lista:
cd apps/mi-app
vercel link                    # Crear proyecto en Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add APP_ID
vercel domains add miapp.com   # Agregar dominio
vercel --prod                  # Deploy
```

---

## Workflow Diario con Claude Code

```bash
# Abrir terminal y navegar al repo
cd apphouse.ai

# Pedirle a Claude Code que trabaje en una app
claude "Agrega una página de pricing a la app mi-app con 3 planes"
claude "Crea una tabla en Supabase para leads en la app crm"
claude "Despliega la app landing a producción"

# Dev local
npx turbo dev --filter=mi-app

# Deploy (automático con git push, o manual)
git push origin main           # Auto-deploy en Vercel
vercel --prod                  # Deploy manual
```

---

## Checklist por App Nueva

- [ ] Directorio creado en `apps/`
- [ ] `package.json` con dependencias
- [ ] `.env.local` con APP_ID y Supabase creds
- [ ] Migración SQL si necesita tablas propias
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno en Vercel
- [ ] Dominio comprado en GoDaddy
- [ ] DNS configurado (CNAME → Vercel)
- [ ] SSL verificado
- [ ] Registrado en tabla `apps` de Supabase
