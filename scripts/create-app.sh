#!/bin/bash
# =============================================================================
# apphouse.ai — create new app
# usage: ./scripts/create-app.sh <slug> "<name>" "<domain>" [web|mobile|full]
# =============================================================================

set -e

APP_SLUG=$1
APP_NAME=$2
APP_DOMAIN=$3
APP_TYPE=${4:-"web"}  # default: web only

if [ -z "$APP_SLUG" ] || [ -z "$APP_NAME" ]; then
  echo ""
  echo "  usage: ./scripts/create-app.sh <slug> \"<name>\" \"<domain>\" [web|mobile|full]"
  echo ""
  echo "  types:"
  echo "    web     — next.js app (default)"
  echo "    mobile  — expo app (ios + android)"
  echo "    full    — both web + mobile"
  echo ""
  echo "  examples:"
  echo "    ./scripts/create-app.sh my-crm \"my crm\" \"mycrm.com\""
  echo "    ./scripts/create-app.sh my-crm \"my crm\" \"mycrm.com\" full"
  echo "    ./scripts/create-app.sh my-crm \"my crm\" \"\" mobile"
  exit 1
fi

# navigate to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

APP_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

echo ""
echo "  apphouse.ai — creating new app"
echo "  ─────────────────────────────────"
echo "  slug:   $APP_SLUG"
echo "  name:   $APP_NAME"
echo "  domain: ${APP_DOMAIN:-'(none yet)'}"
echo "  type:   $APP_TYPE"
echo "  app_id: $APP_ID"
echo ""

# ─────────────────────────────────────
# helper: apply template replacements
# ─────────────────────────────────────
apply_replacements() {
  local dir=$1
  find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.local" \) | while read file; do
    sed -i "s/{{APP_NAME}}/$APP_NAME/g" "$file"
    sed -i "s/{{APP_SLUG}}/$APP_SLUG/g" "$file"
    sed -i "s/{{APP_ID}}/$APP_ID/g" "$file"
  done
}

# ─────────────────────────────────────
# web (next.js)
# ─────────────────────────────────────
create_web() {
  local APP_DIR="apps/$APP_SLUG"

  if [ -d "$APP_DIR" ]; then
    echo "  warning: web directory already exists, skipping"
    return
  fi

  echo "  → creating web app (next.js)..."
  cp -r apps/_template "$APP_DIR"
  apply_replacements "$APP_DIR"

  cat > "$APP_DIR/.env.local" << EOF
# apphouse.ai — $APP_NAME (web)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
APP_ID=$APP_ID
NEXT_PUBLIC_APP_ID=$APP_ID
NEXT_PUBLIC_APP_NAME=$APP_NAME
NEXT_PUBLIC_APP_DOMAIN=${APP_DOMAIN:-localhost:3000}
EOF

  echo "  done: web app at $APP_DIR"
}

# ─────────────────────────────────────
# mobile (expo — ios + android)
# ─────────────────────────────────────
create_mobile() {
  local APP_DIR="apps/${APP_SLUG}-mobile"

  if [ -d "$APP_DIR" ]; then
    echo "  warning: mobile directory already exists, skipping"
    return
  fi

  echo "  → creating mobile app (expo)..."
  cp -r apps/_template-mobile "$APP_DIR"
  apply_replacements "$APP_DIR"

  # also replace in app.json
  sed -i "s/{{APP_NAME}}/$APP_NAME/g" "$APP_DIR/app.json"
  sed -i "s/{{APP_SLUG}}/$APP_SLUG/g" "$APP_DIR/app.json"
  sed -i "s/{{APP_ID}}/$APP_ID/g" "$APP_DIR/app.json"

  cat > "$APP_DIR/.env.local" << EOF
# apphouse.ai — $APP_NAME (mobile)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_APP_ID=$APP_ID
EOF

  echo "  done: mobile app at $APP_DIR"
}

# ─────────────────────────────────────
# execute based on type
# ─────────────────────────────────────
case $APP_TYPE in
  web)
    create_web
    ;;
  mobile)
    create_mobile
    ;;
  full)
    create_web
    create_mobile
    ;;
  *)
    echo "  error: unknown type '$APP_TYPE' (use: web, mobile, or full)"
    exit 1
    ;;
esac

echo ""
echo "  ─────────────────────────────────"
echo "  next steps:"
echo ""

if [ "$APP_TYPE" = "web" ] || [ "$APP_TYPE" = "full" ]; then
  echo "  web:"
  echo "    cd apps/$APP_SLUG && npm install"
  echo "    npx turbo dev --filter=$APP_SLUG"
  echo "    vercel link && vercel --prod"
  if [ -n "$APP_DOMAIN" ]; then
    echo "    vercel domains add $APP_DOMAIN"
  fi
  echo ""
fi

if [ "$APP_TYPE" = "mobile" ] || [ "$APP_TYPE" = "full" ]; then
  echo "  mobile:"
  echo "    cd apps/${APP_SLUG}-mobile && npm install"
  echo "    npx expo start                  # dev"
  echo "    npx expo start --ios            # ios simulator"
  echo "    npx expo start --android        # android emulator"
  echo "    eas build --platform all        # production builds"
  echo ""
fi

echo "  app_id (shared across platforms): $APP_ID"
echo ""
