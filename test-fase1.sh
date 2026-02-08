#!/bin/bash
echo "=== Teste Fase 1: Segurança ==="
echo ""

echo "1. Testar API /api/dossier sem autenticação..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/dossier)
echo "HTTP Status: $response"
if [ "$response" = "401" ]; then
    echo "✅ PASSOU: API bloqueou acesso sem autenticação"
else
    echo "❌ FALHOU: API não bloqueou acesso (esperado: 401, obtido: $response)"
fi

echo ""
echo "2. Testar API /api/eligibility/recommendations sem autenticação..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/eligibility/recommendations)
echo "HTTP Status: $response"
if [ "$response" = "401" ]; then
    echo "✅ PASSOU: API bloqueou acesso sem autenticação"
else
    echo "❌ FALHOU: API não bloqueou acesso (esperado: 401, obtido: $response)"
fi

echo ""
echo "3. Testar middleware para /conta/dossier..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/conta/dossier)
echo "HTTP Status: $response"
if [ "$response" = "307" ] || [ "$response" = "302" ]; then
    echo "✅ PASSOU: Middleware redirecionou para login"
elif [ "$response" = "200" ]; then
    echo "❌ FALHOU: Middleware não bloqueou acesso"
else
    echo "⚠️ INCERTO: Status inesperado (obtido: $response)"
fi

echo ""
echo "4. Verificar se servidor está acessível..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "Homepage HTTP Status: $response"
if [ "$response" = "200" ]; then
    echo "✅ Servidor funcional"
else
    echo "❌ Servidor com problemas"
fi