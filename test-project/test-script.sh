#!/bin/bash

echo "🧪 Testing Prettier Plugin for Tera"
echo "=================================="

# Test basic template
echo -e "\n📄 Testing sample.tera:"
echo "----------------------"
npx prettier --check sample.tera || npx prettier --write sample.tera

# Test comprehensive template
echo -e "\n📄 Testing comprehensive.tera:"
echo "-----------------------------"
npx prettier --check comprehensive.tera || npx prettier --write comprehensive.tera

# Show formatted output
echo -e "\n🎨 Formatted sample.tera:"
echo "------------------------"
cat sample.tera

echo -e "\n✅ All files formatted!"