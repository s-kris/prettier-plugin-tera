import { parseTeraTemplate } from '../src/parser';
import { printTeraAst } from '../src/printer';

describe('printTeraAst', () => {
  test('should format simple Tera expressions', () => {
    const input = '{{name}}';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output.trim()).toBe('{{ name }}');
  });

  test('should format Tera expressions with filters', () => {
    const input = '{{name|upper|truncate(length=10)}}';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output.trim()).toBe('{{ name | upper | truncate(length=10) }}');
  });

  test('should format HTML with proper indentation', () => {
    const input = '<div><p>{{ content }}</p></div>';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    const expected = `<div>
  <p>{{ content }}</p>
</div>`;
    expect(output.trim()).toBe(expected);
  });

  test('should format Tera blocks with proper indentation', () => {
    const input = '{% if user %}{{ user.name }}{% endif %}';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    const expected = `{% if user %}
  {{ user.name }}
{% endif %}`;
    expect(output.trim()).toBe(expected);
  });

  test('should format complex nested structures', () => {
    const input = `<ul>{% for item in items %}<li>{{ item.name }}</li>{% endfor %}</ul>`;
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    const expected = `<ul>
  {% for item in items %}
    <li>{{ item.name }}</li>
  {% endfor %}
</ul>`;
    expect(output.trim()).toBe(expected);
  });

  test('should format with custom options', () => {
    const input = '{{ name }}';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast, { 
      teraExpressionSpacing: false,
      tabWidth: 4 
    });
    
    expect(output.trim()).toBe('{{name}}');
  });

  test('should format Tera comments', () => {
    const input = '{#comment#}';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output.trim()).toBe('{# comment #}');
  });

  test('should format HTML attributes with Tera expressions', () => {
    const input = '<div class="{{css_class}}" data-id="{{item.id}}">Content</div>';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output).toContain('class="{{ css_class }}"');
    expect(output).toContain('data-id="{{ item.id }}"');
  });

  test('should handle multiline attributes correctly', () => {
    const input = '<div class="very-long-class-name" data-really-long-attribute="some-value" id="element-id">Content</div>';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast, { printWidth: 50 });
    
    // Should break long attribute lists
    expect(output.split('\n').length).toBeGreaterThan(1);
  });

  test('should preserve text content properly', () => {
    const input = '<p>Hello {{ name }}, how are you today?</p>';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output).toContain('Hello {{ name }}, how are you today?');
  });

  test('should format self-closing tags', () => {
    const input = '<img src="{{ image_url }}" alt="{{ alt_text }}" />';
    const ast = parseTeraTemplate(input);
    const output = printTeraAst(ast);
    
    expect(output).toContain('/>');
    expect(output).toContain('src="{{ image_url }}"');
  });
});