#!/bin/bash
# verify-setup.sh - Verifica se o ambiente está pronto para testes

echo "======================================"
echo "Portal Casa Eficiente - Verificação"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
echo "1. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js instalado: $NODE_VERSION"
else
    echo "   ❌ Node.js não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo "2. Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm instalado: v$NPM_VERSION"
else
    echo "   ❌ npm não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Check node_modules
echo "3. Verificando dependências..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules existe"
else
    echo "   ⚠️  node_modules não encontrado. Execute: npm install"
    WARNINGS=$((WARNINGS + 1))
fi

# Check .env file
echo "4. Verificando ficheiro .env..."
if [ -f ".env" ]; then
    echo "   ✅ Ficheiro .env existe"
    
    # Check critical env vars
    if grep -q "DATABASE_URL=" .env && grep -q "AUTH_SECRET=" .env; then
        echo "   ✅ Variáveis essenciais configuradas"
    else
        echo "   ⚠️  Algumas variáveis essenciais podem estar em falta"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠️  Ficheiro .env não existe. Copie de .env.example"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if build works
echo "5. Verificando se o build funciona..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build passa sem erros"
else
    echo "   ❌ Build falhou. Execute: npm run build"
    ERRORS=$((ERRORS + 1))
fi

# Check linting
echo "6. Verificando linting..."
if npm run lint > /dev/null 2>&1; then
    echo "   ✅ Linting passa sem erros"
else
    echo "   ⚠️  Linting tem problemas"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Prisma
echo "7. Verificando Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    echo "   ✅ Schema Prisma existe"
else
    echo "   ❌ Schema Prisma não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================"
echo "Resumo:"
echo "======================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Ambiente completamente configurado!"
    echo "   Execute: npm run dev"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS aviso(s) encontrado(s)"
    echo "   O projeto pode funcionar, mas verifique os avisos acima"
    exit 0
else
    echo "❌ $ERRORS erro(s) e $WARNINGS aviso(s) encontrados"
    echo "   Resolva os erros antes de prosseguir"
    exit 1
fi
