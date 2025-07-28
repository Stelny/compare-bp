# E-shop Platební Prototyp

Prototyp e-shopu s integrací platebních bran (Stripe, PayPal, GoPay) vytvořený pomocí Node.js a Express.js.

## 🚀 Funkce

- **API endpointy pro vytvoření platby** - podporuje Stripe, PayPal a GoPay
- **SDK integrace** - používá oficiální SDK pro všechny platební brány
- **Webhook endpointy** - zpracování asynchronních notifikací od platebních bran
- **Webhook listenery** - samostatné služby pro naslouchání webhookům
- **Konfigurační modul** - centrální správa API klíčů a nastavení
- **Front-end simulace** - jednoduché HTML rozhraní pro testování
- **Zátěžové testování** - k6 skript pro testování výkonu
- **SQLite databáze** - ukládání a sledování stavu plateb
- **Admin panel** - přehled všech plateb v systému
- **Success stránka** - zobrazení výsledku platby s daty z databáze

## 📋 Požadavky

- Node.js (verze 14 nebo vyšší)
- npm nebo yarn

## 🛠️ Instalace

1. Klonujte repozitář:
```bash
git clone <repository-url>
cd compare-bp
```

2. Nainstalujte závislosti:
```bash
npm install
```

3. Spusťte aplikaci:
```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

## 🔧 Konfigurace

### Environment Variables

1. Zkopírujte `env.example` do `.env`:
```bash
cp env.example .env
```

2. Upravte `.env` soubor s vašimi skutečnými API klíči:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production

# GoPay Configuration
GOPAY_GOID=your_gopay_go_id
GOPAY_CLIENT_ID=your_gopay_client_id
GOPAY_CLIENT_SECRET=your_gopay_client_secret
```

**⚠️ Důležité:** Nikdy necommitněte `.env` soubor do repozitáře! Je již přidán do `.gitignore`.

## 📡 API Endpointy

### Vytvoření platby
- `POST /api/payment/create` - obecný endpoint
- `POST /api/payment/create/stripe` - Stripe platba
- `POST /api/payment/create/paypal` - PayPal platba
- `POST /api/payment/create/gopay` - GoPay platba

### Databáze a status plateb
- `GET /api/payment/status/:sessionId` - status konkrétní platby
- `GET /api/payment/all` - všechny platby (admin)
- `GET /api/payment-info/:sessionId` - informace o platbě pro success stránku

### Webhooky
- `POST /api/webhook/stripe` - Stripe webhook
- `POST /api/webhook/paypal` - PayPal webhook
- `POST /api/webhook/gopay` - GoPay webhook

### HTML Stránky
- `GET /` - hlavní stránka pro vytvoření plateb
- `GET /success` - success stránka s výsledkem platby
- `GET /cancel` - cancel stránka pro zrušené platby
- `GET /admin` - admin panel pro přehled plateb

## 🗄️ Databáze

Aplikace používá SQLite databázi (`payments.db`) pro ukládání informací o platbách:

### Struktura databáze
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  gateway TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  order_id TEXT,
  session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Stav plateb
- `pending` - platba čeká na zpracování
- `success` - platba byla úspěšná
- `failed` - platba selhala

## 🧪 Testování

### Front-end testování
- **Hlavní stránka**: `http://localhost:3000` - vytvoření plateb
- **Success stránka**: `http://localhost:3000/success` - výsledek platby
- **Cancel stránka**: `http://localhost:3000/cancel` - zrušené platby
- **Admin panel**: `http://localhost:3000/admin` - přehled všech plateb

### API testování
```bash
# Test API endpointů
node test-api.js

# Test databáze
npm run test:db
```

### Zátěžové testování s k6
```bash
# Instalace k6 (macOS)
brew install k6

# Spuštění zátěžového testu
k6 run k6-load-test.js
```

### Webhook listenery

```bash
# Spuštění Stripe webhook listeneru
npm run stripe:listen

# Spuštění PayPal webhook listeneru
npm run paypal:listen

# Spuštění GoPay webhook listeneru
npm run gopay:listen

# Spuštění všech webhook listenerů najednou
npm run webhook:all

# Nebo použijte shell skript
./start-webhooks.sh
```

### Testování webhooků lokálně

```bash
# Stripe CLI (vyžaduje nainstalovaný Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhook/stripe

# PayPal webhook simulator
# Použijte PayPal Developer Dashboard pro simulaci webhooků

# GoPay webhook simulator
# Použijte GoPay Developer Dashboard pro simulaci webhooků
```

**📖 Podrobný návod pro Stripe webhooky:** Viz [STRIPE_WEBHOOK_SETUP.md](STRIPE_WEBHOOK_SETUP.md)

## 🏗️ Architektura

```
src/
├── app.ts              # Hlavní Express aplikace
├── config/             # Konfigurační modul
├── database/           # SQLite databáze
│   └── index.ts        # Databázové operace
├── routes/             # API routy
│   ├── payment.ts      # Platební endpointy
│   └── webhook.ts      # Webhook endpointy
├── services/           # Platební brány
│   ├── stripe.ts       # Stripe integrace
│   ├── paypal.ts       # PayPal integrace
│   └── gopay.ts        # GoPay integrace
└── types/              # TypeScript typy
    └── payment.ts      # Platební typy

public/
├── index.html          # Front-end pro testování
├── success.html        # Success stránka
├── cancel.html         # Cancel stránka
└── admin.html          # Admin panel
```

## 🔒 Bezpečnost

- Všechny API klíče jsou v sandbox/testovacím prostředí
- Webhooky jsou veřejně přístupné pro testování
- Pro produkci implementujte autentifikaci a autorizaci
- SQLite databáze je lokální a není vystavena na internet

## 📝 Poznámky

- **Stripe**: Používá oficiální Stripe SDK s plnou podporou webhooků
- **PayPal**: Používá oficiální PayPal Server SDK  
- **GoPay**: Implementováno s připraveností pro SDK integraci (momentálně simulované)
- Všechny platební brány jsou nakonfigurovány pro sandbox prostředí
- Pro produkci nastavte správné API klíče v `.env` souboru
- Pro plnou GoPay SDK integraci je potřeba vyřešit TypeScript deklarace
- Databáze se automaticky vytvoří při prvním spuštění aplikace
- Webhooky automaticky aktualizují stav plateb v databázi
- HTML stránky jsou dostupné přes Express routes