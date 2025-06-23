# prettier-plugin-tera

A [Prettier](https://prettier.io/) plugin for formatting [Tera](https://github.com/Keats/tera) and Jinja2 HTML templates.

## Features

- ✅ Formats Tera/Jinja2 template syntax (`{{ }}`, `{% %}`, `{# #}`)
- ✅ Preserves HTML structure while formatting template constructs  
- ✅ Supports complex nested templates and template inheritance
- ✅ Configurable formatting options
- ✅ Compatible with existing HTML and template workflows

## Installation

```bash
npm install --save-dev prettier prettier-plugin-tera
```

## Usage

### Basic Usage

Once installed, the plugin will automatically format files with these extensions:
- `.tera`
- `.html.tera` 
- `.jinja`
- `.jinja2`
- `.j2`

### Configuration

Add to your `.prettierrc` file:

```json
{
  "plugins": ["prettier-plugin-tera"],
  "overrides": [
    {
      "files": ["**/*.tera", "**/*.jinja", "**/*.jinja2", "**/*.j2", "**/*.html"],
      "options": {
        "parser": "tera-template",
        "teraExpressionSpacing": true,
        "teraBlockIndentation": 2,
        "preserveTeraWhitespace": false
      }
    }
  ]
}
```

**Note**: Add `"**/*.html"` to the files array if your HTML files contain Tera/Jinja2 syntax.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `teraExpressionSpacing` | `boolean` | `true` | Add spaces inside Tera expression braces: `{{ var }}` vs `{{var}}` |
| `teraBlockIndentation` | `number` | `2` | Number of spaces to indent Tera block content |
| `preserveTeraWhitespace` | `boolean` | `false` | Preserve original whitespace in text nodes |

## Examples

### Input
```html
<div class="{{css_class}}">
{% if user.is_authenticated %}
<h1>Hello {{user.name|default(value="Guest")}}</h1>
<ul>
{% for item in user.items %}
<li>{{item.title|upper}}</li>
{% endfor %}
</ul>
{% endif %}
{# TODO: Add user preferences #}
</div>
```

### Formatted Output
```html
<div class="{{ css_class }}">
  {% if user.is_authenticated %}
    <h1>Hello {{ user.name | default(value="Guest") }}</h1>
    <ul>
      {% for item in user.items %}
        <li>{{ item.title | upper }}</li>
      {% endfor %}
    </ul>
  {% endif %}
  {# TODO: Add user preferences #}
</div>
```

## Supported Template Constructs

- **Expressions**: `{{ variable }}`, `{{ variable | filter }}`
- **Statements**: `{% if condition %}`, `{% for item in items %}`  
- **Comments**: `{# comment #}`
- **Blocks**: `{% block name %}...{% endblock %}`, `{% block name %}...{% endblock name %}`
- **Macros**: `{% macro name(args) %}...{% endmacro %}`
- **Template inheritance**: `{% extends "base.html" %}`, `{% include "partial.html" %}`
- **Control flow**: `{% else %}`, `{% elif condition %}`
- **Other tags**: `{% set %}`, `{% filter %}`, `{% raw %}...{% endraw %}`

## Editor Integration

### VS Code

1. Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
2. Add to your `settings.json`:

```json
{
  "prettier.documentSelectors": ["**/*.tera", "**/*.jinja", "**/*.jinja2", "**/*.j2"],
  "[tera]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jinja]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.associations": {
    "*.tera": "html",
    "*.jinja": "html",
    "*.jinja2": "html",
    "*.j2": "html"
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Troubleshooting

### Plugin not loading

If the plugin isn't being recognized:

1. Ensure it's properly installed: `npm ls prettier-plugin-tera`
2. Try specifying the plugin explicitly in `.prettierrc`:
   ```json
   {
     "plugins": ["./node_modules/prettier-plugin-tera"]
   }
   ```

### Formatting issues

- If your HTML files aren't being formatted, make sure to include `"**/*.html"` in the files array
- For better results with complex templates, consider increasing `printWidth` in your Prettier config
- Use `preserveTeraWhitespace: true` if you need to maintain exact spacing in certain templates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Tera](https://github.com/Keats/tera) - Template engine for Rust
- [djLint](https://github.com/djlint/djLint) - HTML template linter and formatter
- [prettier-plugin-jinja-template](https://github.com/davidodenwald/prettier-plugin-jinja-template) - Similar plugin for Jinja templates