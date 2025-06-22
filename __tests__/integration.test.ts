import { parseTeraTemplate } from '../src/parser';
import { printTeraAst } from '../src/printer';

describe('Integration Tests', () => {
  function formatTemplate(input: string, options = {}) {
    const ast = parseTeraTemplate(input);
    return printTeraAst(ast, options);
  }

  test('should handle complete real-world template', () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{page_title|default(value="My Website")}}</title>
</head>
<body>
    <header>
        <h1>Welcome {{user.name|default(value="Guest")}}</h1>
        {# Navigation menu #}
        <nav>
            <ul>
                {% for item in menu_items %}
                <li><a href="{{item.url}}">{{item.title}}</a></li>
                {% endfor %}
            </ul>
        </nav>
    </header>

    <main>
        {% if messages %}
        <div class="messages">
            {% for message in messages %}
            <div class="alert alert-{{message.type}}">
                {{message.text|safe}}
            </div>
            {% endfor %}
        </div>
        {% endif %}

        <section class="content">
            {{content|safe}}
        </section>
    </main>

    <footer>
        <p>&copy; {{current_year}} My Website. All rights reserved.</p>
    </footer>
</body>
</html>`;

    const formatted = formatTemplate(input);
    
    // Basic checks
    expect(formatted).toContain('<!DOCTYPE html>');
    expect(formatted).toContain('{{ page_title | default(value="My Website") }}');
    expect(formatted).toContain('{{ user.name | default(value="Guest") }}');
    expect(formatted).toContain('{# Navigation menu #}');
    
    // Ensure proper indentation
    const lines = formatted.split('\n');
    const navSection = lines.find(line => line.includes('<nav>'));
    const ulSection = lines.find(line => line.includes('<ul>'));
    
    if (navSection && ulSection) {
      const navIndent = navSection.match(/^(\s*)/)?.[1]?.length || 0;
      const ulIndent = ulSection.match(/^(\s*)/)?.[1]?.length || 0;
      expect(ulIndent).toBeGreaterThan(navIndent);
    }
  });

  test('should handle forms with Tera constructs', () => {
    const input = `<form method="post" action="{{form_action}}">
{% csrf_token %}
<div class="form-group">
<label for="name">Name:</label>
<input type="text" id="name" name="name" value="{{form.name.value|default(value="")}}" {% if form.name.errors %}class="error"{% endif %}>
{% if form.name.errors %}
<span class="error-message">{{form.name.errors.0}}</span>
{% endif %}
</div>
<button type="submit">Submit</button>
</form>`;

    const formatted = formatTemplate(input);
    
    expect(formatted).toContain('action="{{ form_action }}"');
    expect(formatted).toContain('{% csrf_token %}');
    expect(formatted).toContain('value="{{ form.name.value | default(value="") }}"');
    
    // Check indentation consistency
    expect(formatted).toMatch(/^\s*<div class="form-group">/m);
    expect(formatted).toMatch(/^\s{2,}<label for="name">/m);
  });

  test('should handle template inheritance patterns', () => {
    const input = `{% extends "base.html" %}

{% block title %}{{page_title}} - {{site_name}}{% endblock %}

{% block content %}
<div class="container">
    <h1>{{heading}}</h1>
    
    {% block main_content %}
    <p>Default content goes here.</p>
    {% endblock %}
    
    {% if sidebar_content %}
    <aside class="sidebar">
        {{sidebar_content|safe}}
    </aside>
    {% endif %}
</div>
{% endblock %}

{% block scripts %}
{{block.super}}
<script src="{{static_url}}js/page-specific.js"></script>
{% endblock %}`;

    const formatted = formatTemplate(input);
    
    expect(formatted).toContain('{% extends "base.html" %}');
    expect(formatted).toContain('{% block title %}{{ page_title }} - {{ site_name }}{% endblock %}');
    expect(formatted).toContain('{{ static_url }}js/page-specific.js');
    expect(formatted).toContain('{{ block.super }}');
  });

  test('should handle macros and includes', () => {
    const input = `{% macro render_field(field, label="") %}
<div class="form-field">
{% if label %}
<label for="{{field.id}}">{{label}}</label>
{% endif %}
{{field|safe}}
{% if field.errors %}
<span class="error">{{field.errors.0}}</span>
{% endif %}
</div>
{% endmacro %}

<form>
{{render_field(form.email, label="Email Address")}}
{{render_field(form.password, label="Password")}}
</form>

{% include "partials/footer.html" %}`;

    const formatted = formatTemplate(input);
    
    expect(formatted).toContain('{% macro render_field(field, label="") %}');
    expect(formatted).toContain('{% endmacro %}');
    expect(formatted).toContain('{{ render_field(form.email, label="Email Address") }}');
    expect(formatted).toContain('{% include "partials/footer.html" %}');
  });

  test('should preserve whitespace control when needed', () => {
    const input = `<p>
Hello {{- name -}}, welcome!
</p>`;

    const formatted = formatTemplate(input, { preserveTeraWhitespace: true });
    
    // When preserving whitespace, original spacing should be maintained
    expect(formatted).toContain('{{- name -}}');
  });

  test('should handle complex filter chains', () => {
    const input = `{{user.created_at|date(format="%Y-%m-%d")|default(value="Unknown")}}
{{content|markdown|truncate(length=200)|safe}}
{{price|round(precision=2)|floatformat|currency}}`;

    const formatted = formatTemplate(input);
    
    expect(formatted).toContain('{{ user.created_at | date(format="%Y-%m-%d") | default(value="Unknown") }}');
    expect(formatted).toContain('{{ content | markdown | truncate(length=200) | safe }}');
    expect(formatted).toContain('{{ price | round(precision=2) | floatformat | currency }}');
  });

  test('should handle idempotency - formatting twice should yield same result', () => {
    const input = `<div class="container">
{% for item in items %}
<div class="item">
<h3>{{item.title}}</h3>
<p>{{item.description|truncate(length=100)}}</p>
</div>
{% endfor %}
</div>`;

    const firstFormat = formatTemplate(input);
    const secondFormat = formatTemplate(firstFormat);
    
    expect(firstFormat).toBe(secondFormat);
  });
});