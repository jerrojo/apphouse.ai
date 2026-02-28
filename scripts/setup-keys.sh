#!/bin/bash
# =============================================================================
# apphouse.ai — interactive api key setup
# run once to configure all services
# =============================================================================

set -e

ENV_FILE=".env.local"

echo ""
echo "  apphouse.ai — api key setup"
echo "  ─────────────────────────────"
echo "  account: jerovargas@gmail.com"
echo ""

# check if .env.local exists
if [ -f "$ENV_FILE" ]; then
  echo "  .env.local already exists. overwrite? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    echo "  keeping existing .env.local"
    exit 0
  fi
fi

cat > "$ENV_FILE" << 'HEADER'
# =============================================================================
# apphouse.ai — environment variables
# account: jerovargas@gmail.com
# NEVER commit this file
# =============================================================================

HEADER

echo "  ── required keys ──"
echo ""

# function to prompt for key
ask_key() {
  local name=$1
  local url=$2
  local current=""

  echo "  $name"
  echo "  → get it at: $url"
  read -r -p "  enter value (or press enter to skip): " value
  if [ -n "$value" ]; then
    echo "$name=$value" >> "$ENV_FILE"
    echo "  ✓ saved"
  else
    echo "# $name=  # TODO: add this" >> "$ENV_FILE"
    echo "  ⏭ skipped (add later)"
  fi
  echo ""
}

# required
ask_key "ANTHROPIC_API_KEY" "https://console.anthropic.com/settings/keys"
ask_key "NEXT_PUBLIC_SUPABASE_URL" "https://supabase.com/dashboard → project → settings → api"
ask_key "NEXT_PUBLIC_SUPABASE_ANON_KEY" "same page as above"
ask_key "SUPABASE_SERVICE_ROLE_KEY" "same page as above (service_role key)"
ask_key "VERCEL_TOKEN" "https://vercel.com/account/tokens"
ask_key "GITHUB_TOKEN" "https://github.com/settings/tokens → generate new (classic)"
ask_key "STRIPE_SECRET_KEY" "https://dashboard.stripe.com/apikeys"
ask_key "STRIPE_PUBLISHABLE_KEY" "same page as above"

echo "" >> "$ENV_FILE"
echo "# ── mobile publishing ──" >> "$ENV_FILE"

echo "  ── mobile publishing keys ──"
echo ""
ask_key "EXPO_TOKEN" "https://expo.dev/accounts/settings/access-tokens"
ask_key "APPLE_TEAM_ID" "https://developer.apple.com/account → membership"
ask_key "ASC_API_KEY_ID" "https://appstoreconnect.apple.com/access/api"
ask_key "GOOGLE_PLAY_JSON_KEY" "https://play.google.com/console → setup → api access"

echo "" >> "$ENV_FILE"
echo "# ── recommended ──" >> "$ENV_FILE"

echo "  ── recommended keys ──"
echo ""
ask_key "GODADDY_API_KEY" "https://developer.godaddy.com/keys"
ask_key "GODADDY_API_SECRET" "same page as above"
ask_key "FIGMA_ACCESS_TOKEN" "https://www.figma.com/developers/api#access-tokens"
ask_key "OPENAI_API_KEY" "https://platform.openai.com/api-keys (for whisper/voice)"
ask_key "NEXT_PUBLIC_POSTHOG_KEY" "https://app.posthog.com → project settings"
ask_key "RESEND_API_KEY" "https://resend.com/api-keys"
ask_key "SENTRY_DSN" "https://sentry.io → project → settings → client keys"
ask_key "NEXT_PUBLIC_GA_ID" "https://analytics.google.com → admin → data streams"

echo ""
echo "  ─────────────────────────────"
echo "  ✓ .env.local created"
echo ""
echo "  remember:"
echo "    - never commit .env.local"
echo "    - copy relevant keys to vercel env vars per app"
echo "    - run 'vercel env pull' to sync"
echo ""
