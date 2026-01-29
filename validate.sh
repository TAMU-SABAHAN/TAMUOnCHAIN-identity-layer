#!/bin/bash

# Simple validation script to check the project structure

echo "🔍 Validating TAMUOnCHAIN Identity Layer..."

# Check required files exist
echo "Checking required files..."
files=(
    "package.json"
    "tsconfig.json"
    "Dockerfile"
    "docker-compose.yml"
    "src/index.ts"
    "src/reputation.ts"
    "src/rateLimit.ts"
    "src/ensResponses.ts"
    "public/index.html"
    "migrations/schema.sql"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
        exit 1
    fi
done

# Check TypeScript compilation
echo ""
echo "Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo "✓ TypeScript compilation successful"
else
    echo "✗ TypeScript compilation failed"
    exit 1
fi

# Check built files
echo ""
echo "Checking built files..."
built_files=(
    "dist/index.js"
    "dist/reputation.js"
    "dist/rateLimit.js"
    "dist/ensResponses.js"
)

for file in "${built_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
        exit 1
    fi
done

echo ""
echo "✅ All validations passed!"
