#!/bin/bash

echo "🔔 Spouštím všechny webhook listenery..."
echo ""

# Kill any existing webhook listeners
pkill -f "stripe-webhook" 2>/dev/null
pkill -f "paypal-webhook" 2>/dev/null
pkill -f "gopay-webhook" 2>/dev/null

sleep 2

echo "📡 Spouštím Stripe webhook listener na portu 3001..."
npm run stripe:listen &
STRIPE_PID=$!

echo "📡 Spouštím PayPal webhook listener na portu 3002..."
npm run paypal:listen &
PAYPAL_PID=$!

echo "📡 Spouštím GoPay webhook listener na portu 3003..."
npm run gopay:listen &
GOPAY_PID=$!

echo ""
echo "✅ Všechny webhook listenery jsou spuštěny!"
echo ""
echo "🔗 Webhook URL:"
echo "   Stripe:  http://localhost:3001/webhook/stripe"
echo "   PayPal:  http://localhost:3002/webhook/paypal"
echo "   GoPay:   http://localhost:3003/webhook/gopay"
echo ""
echo "🏥 Health checks:"
echo "   Stripe:  http://localhost:3001/health"
echo "   PayPal:  http://localhost:3002/health"
echo "   GoPay:   http://localhost:3003/health"
echo ""
echo "💡 Pro zastavení všech listenerů stiskněte Ctrl+C"
echo ""

# Wait for all processes
wait 