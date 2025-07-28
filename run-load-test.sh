#!/bin/bash

echo "🚀 Spouštím zátěžový test s k6..."
echo "📊 Test bude simulovat až 100 souběžných uživatelů"
echo "⏱️  Doba trvání: ~5 minut"
echo ""

# Kontrola, zda je k6 nainstalováno
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 není nainstalováno!"
    echo "📦 Instalace k6:"
    echo "   macOS: brew install k6"
    echo "   Ubuntu/Debian: sudo apt-get install k6"
    echo "   Windows: choco install k6"
    exit 1
fi

# Kontrola, zda server běží
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Server neběží na localhost:3000!"
    echo "💡 Spusťte nejdříve: npm run dev"
    exit 1
fi

echo "✅ Server je dostupný"
echo "🧪 Spouštím zátěžový test..."
echo ""

k6 run k6-load-test.js

echo ""
echo "📈 Test dokončen!"
echo "📊 Výsledky najdete výše" 