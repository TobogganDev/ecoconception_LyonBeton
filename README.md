# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Écoconception

📄 [Rapport d'Optimisation Écoconception](audit/RAPPORT_ECOCONCEPTION.md) — audit Lighthouse, dépendances, profiling Pyroscope, tests de charge k6 et stratégie de cache.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## OAuth Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to your `.env` file

### GitHub OAuth Setup
1. Go to [GitHub Settings](https://github.com/settings/applications/new)
2. Register a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)
4. Copy Client ID and Client Secret to your `.env` file

### Environment Variables
Copy `.env.example` to `.env` and fill in the OAuth credentials:

```bash
# OAuth Providers
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
```

## Stripe Configuration

### Stripe Setup for Payments
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or log into your existing one
3. Navigate to "Developers" → "API keys"
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Test Mode vs Live Mode
- **Test Mode**: Use test keys for development (no real payments)
- **Live Mode**: Use live keys for production (real payments)

### Environment Variables for Stripe
Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"

# For production, use live keys:
# STRIPE_SECRET_KEY="sk_live_your_live_secret_key_here"
# STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key_here"
```

### Stripe Webhooks (Optional)
1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy the webhook signing secret to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

### Product Prices Setup
The application supports both:
- **Legacy pricing**: Direct price field in Product model
- **Stripe Prices**: Separate Price model with `stripePriceId` for advanced features

To use Stripe Prices:
1. Create products in Stripe Dashboard
2. Create prices for each product
3. Update your database with the corresponding `stripePriceId` values

## Development Setup

1. Start MailDev : docker run -p 1080:1080 -p 1025:1025 maildev/maildev
2. Start App : npm run dev
3. Your app is at :
http://localhost:3000
4. View emails at :
http://localhost:1080

stripe listen --forward-to localhost:3000/api/stripe/webhook
npm test