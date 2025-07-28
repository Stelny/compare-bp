# Stripe Webhook Setup Guide

## 🔧 Nastavení Stripe CLI

### 1. Instalace Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
choco install stripe-cli

# Linux
# Stáhněte z https://github.com/stripe/stripe-cli/releases
```

### 2. Přihlášení do Stripe

```bash
stripe login
```

Tím se otevře prohlížeč, kde se přihlásíte ke svému Stripe účtu.

### 3. Spuštění webhook listeneru

```bash
# Spusťte hlavní aplikaci
npm run dev

# V novém terminálu spusťte Stripe CLI listener
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

### 4. Výstup Stripe CLI

Po spuštění `stripe listen` uvidíte něco jako:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Zkopírujte tento webhook secret a přidejte ho do `.env` souboru:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 5. Testování webhooků

Stripe CLI automaticky přeposílá všechny webhook události na váš endpoint. Když uděláte platbu přes Stripe, uvidíte v konzoli:

```
2025-07-28 12:45:23   --> payment_intent.succeeded [evt_1234567890]
2025-07-28 12:45:23  <--  [200] POST http://localhost:3000/api/webhook/stripe [evt_1234567890]
```

## 📋 Podporované události

Aplikace zpracovává tyto Stripe webhook události:

- `payment_intent.succeeded` - Úspěšná platba
- `payment_intent.payment_failed` - Neúspěšná platba
- `charge.succeeded` - Úspěšný charge
- `charge.failed` - Neúspěšný charge
- `customer.subscription.created` - Vytvořená předplatba
- `customer.subscription.updated` - Aktualizovaná předplatba
- `customer.subscription.deleted` - Smazaná předplatba
- `invoice.payment_succeeded` - Zaplacená faktura
- `invoice.payment_failed` - Nezaplacená faktura

## 🔍 Debugging

### Kontrola webhook secret

```bash
# Zkontrolujte, zda je webhook secret správně nastaven
echo $STRIPE_WEBHOOK_SECRET
```

### Testování endpointu

```bash
# Test health endpointu
curl http://localhost:3000/health

# Test webhook endpointu (bez signature)
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Logy aplikace

Sledujte logy aplikace pro webhook události:

```bash
npm run dev
```

## 🚨 Časté problémy

### 1. "Webhook signature verification failed"

- Zkontrolujte, zda je `STRIPE_WEBHOOK_SECRET` správně nastaven v `.env`
- Ujistěte se, že používáte webhook secret z `stripe listen` (ne z Stripe Dashboard)

### 2. "Cannot read properties of undefined"

- Restartujte aplikaci po změně `.env` souboru
- Zkontrolujte, zda jsou všechny závislosti nainstalovány

### 3. Stripe CLI se nepřipojuje

- Zkontrolujte, zda jste přihlášeni: `stripe login`
- Zkontrolujte, zda aplikace běží na portu 3000
- Zkuste restartovat Stripe CLI

## 📝 Poznámky

- Stripe CLI automaticky přeposílá všechny události z vašeho Stripe účtu
- Pro produkci nastavte webhook endpoint v Stripe Dashboard
- Webhook secret z `stripe listen` je pouze pro lokální testování 