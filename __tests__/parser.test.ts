import { parseTeraTemplate } from '../src/parser';
import { RootNode, TeraExpressionNode, TeraStatementNode, HtmlNode } from '../src/types';

describe('parseTeraTemplate', () => {
  test('should parse simple HTML with Tera expressions', () => {
    const input = '<div>{{ user.name }}</div>';
    const ast = parseTeraTemplate(input);
    
    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(1);
    
    const htmlNode = ast.children[0] as HtmlNode;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.tagName).toBe('div');
    expect(htmlNode.children).toHaveLength(1);
    
    const exprNode = htmlNode.children![0] as TeraExpressionNode;
    expect(exprNode.type).toBe('tera-expression');
    expect(exprNode.expression).toBe('user.name');
  });

  test('should parse Tera expressions with filters', () => {
    const input = '{{ name | upper | truncate(length=10) }}';
    const ast = parseTeraTemplate(input);
    
    const exprNode = ast.children[0] as TeraExpressionNode;
    expect(exprNode.type).toBe('tera-expression');
    expect(exprNode.expression).toBe('name');
    expect(exprNode.filters).toEqual(['upper', 'truncate(length=10)']);
  });

  test('should parse Tera statements', () => {
    const input = '{% if user.is_authenticated %}Welcome!{% endif %}';
    const ast = parseTeraTemplate(input);
    
    expect(ast.children).toHaveLength(3); // if block, text, endif
    const ifNode = ast.children[0] as TeraStatementNode;
    expect(ifNode.type).toBe('tera-block');
    expect(ifNode.keyword).toBe('if');
  });

  test('should parse Tera comments', () => {
    const input = '{# This is a comment #}';
    const ast = parseTeraTemplate(input);
    
    const commentNode = ast.children[0];
    expect(commentNode.type).toBe('tera-comment');
    expect((commentNode as any).content).toBe('This is a comment');
  });

  test('should parse complex HTML with multiple Tera constructs', () => {
    const input = `
      <html>
        <head>
          <title>{{ page_title | default(value="Default Title") }}</title>
        </head>
        <body>
          {% if messages %}
            <ul>
              {% for message in messages %}
                <li class="{{ message.type }}">{{ message.text }}</li>
              {% endfor %}
            </ul>
          {% endif %}
          {# User info section #}
          <div id="user-info">
            {{ user.name }} - {{ user.email }}
          </div>
        </body>
      </html>
    `;
    
    const ast = parseTeraTemplate(input);
    expect(ast.type).toBe('root');
    expect(ast.children.length).toBeGreaterThan(0);
  });

  test('should handle HTML attributes with Tera expressions', () => {
    const input = '<div class="{{ css_class }}" data-id="{{ item.id }}">Content</div>';
    const ast = parseTeraTemplate(input);
    
    const htmlNode = ast.children[0] as HtmlNode;
    expect(htmlNode.attributes).toHaveLength(2);
    expect(htmlNode.attributes![0].name).toBe('class');
    expect(htmlNode.attributes![0].value).toBe('{{ css_class }}');
  });

  test('should parse empty template', () => {
    const input = '';
    const ast = parseTeraTemplate(input);
    
    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(0);
  });

  test('should parse mixed content', () => {
    const input = 'Hello {{ name }}! {% if logged_in %}Welcome back{% endif %}';
    const ast = parseTeraTemplate(input);
    
    expect(ast.children.length).toBeGreaterThan(2);
    expect(ast.children.some(node => node.type === 'text')).toBe(true);
    expect(ast.children.some(node => node.type === 'tera-expression')).toBe(true);
    expect(ast.children.some(node => node.type === 'tera-block')).toBe(true);
  });
});