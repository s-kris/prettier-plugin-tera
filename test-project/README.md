# Test Project for prettier-plugin-tera

This directory contains test files for the Prettier plugin for Tera/Jinja2 templates.

## Usage

```bash
# Format a file (preview)
npx prettier sample.tera

# Format and write
npx prettier --write *.tera

# Check if files need formatting
npx prettier --check *.tera
```

## Test Files

- `sample.tera` - Basic template with common constructs
- `comprehensive.tera` - Complex template showcasing all features

## Configuration

The `.prettierrc.json` file configures the plugin with:
- Expression spacing enabled
- 2-space indentation for blocks
- 100-character print width

## Testing Different Options

You can test different formatting options by modifying `.prettierrc.json`:

```json
{
  "teraExpressionSpacing": false,  // Removes spaces: {{var}} instead of {{ var }}
  "teraBlockIndentation": 4,        // Use 4 spaces for block indentation
  "preserveTeraWhitespace": true    // Preserve original whitespace
}
```