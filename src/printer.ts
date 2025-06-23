import { 
  TeraNode, 
  RootNode, 
  HtmlNode, 
  TextNode, 
  TeraExpressionNode,
  TeraStatementNode,
  TeraCommentNode,
  TeraBlockNode,
  TeraOptions 
} from './types';

export interface PrinterOptions extends TeraOptions {
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
}

const DEFAULT_OPTIONS: PrinterOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  teraExpressionSpacing: true,
  teraBlockIndentation: 2,
  preserveTeraWhitespace: false
};

function getIndentation(level: number, options: PrinterOptions): string {
  const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth);
  return indent.repeat(level);
}

function formatTeraExpression(node: TeraExpressionNode, options: PrinterOptions): string {
  const spacing = options.teraExpressionSpacing ? ' ' : '';
  let result = `{{${spacing}${node.expression}`;
  
  if (node.filters && node.filters.length > 0) {
    result += ` | ${node.filters.join(' | ')}`;
  }
  
  result += `${spacing}}}`;
  return result;
}

function formatTeraStatement(node: TeraStatementNode, options: PrinterOptions): string {
  const spacing = options.teraExpressionSpacing ? ' ' : '';
  return `{%${spacing}${node.statement}${spacing}%}`;
}

function formatTeraComment(node: TeraCommentNode, options: PrinterOptions): string {
  const spacing = options.teraExpressionSpacing ? ' ' : '';
  return `{#${spacing}${node.content}${spacing}#}`;
}

function formatTeraBlock(
  node: TeraBlockNode, 
  options: PrinterOptions, 
  indentLevel: number
): string {
  const spacing = options.teraExpressionSpacing ? ' ' : '';
  const indent = getIndentation(indentLevel, options);
  const childIndent = getIndentation(indentLevel + 1, options);
  
  let result = `{%${spacing}${node.keyword}`;
  if (node.name) {
    result += ` ${node.name}`;
  }
  result += `${spacing}%}\n`;
  
  // Format children with increased indentation
  for (const child of node.children) {
    const childOutput = printNode(child, options, indentLevel + 1);
    if (childOutput.trim()) {
      result += childIndent + childOutput.trim() + '\n';
    }
  }
  
  // For block statements, include the block name in the end tag
  result += `${indent}{%${spacing}end${node.keyword}`;
  if (node.keyword === 'block' && node.name) {
    result += ` ${node.name}`;
  }
  result += `${spacing}%}`;
  return result;
}

function formatHtmlNode(node: HtmlNode, options: PrinterOptions, indentLevel: number): string {
  const indent = getIndentation(indentLevel, options);
  const childIndent = getIndentation(indentLevel + 1, options);
  
  let result = `<${node.tagName}`;
  
  // Format attributes
  if (node.attributes && node.attributes.length > 0) {
    const attrs = node.attributes.map(attr => {
      if (attr.value !== undefined) {
        // Check if attribute value contains Tera constructs
        if (attr.value.includes('{{') || attr.value.includes('{%')) {
          return `${attr.name}="${attr.value}"`;
        }
        return `${attr.name}="${attr.value}"`;
      }
      return attr.name;
    });
    
    // Decide whether to put attributes on multiple lines
    const attrsString = attrs.join(' ');
    if (result.length + attrsString.length + 1 > options.printWidth && attrs.length > 1) {
      result += '\n' + childIndent + attrs.join('\n' + childIndent);
      result += '\n' + indent;
    } else {
      result += ' ' + attrsString;
    }
  }
  
  if (node.selfClosing) {
    result += ' />';
    return result;
  }
  
  result += '>';
  
  // Format children
  if (node.children && node.children.length > 0) {
    const hasComplexChildren = node.children.some(child => 
      child.type === 'html' || 
      child.type === 'tera-block' ||
      (child.type === 'text' && child.value.includes('\n'))
    );
    
    if (hasComplexChildren) {
      result += '\n';
      for (const child of node.children) {
        const childOutput = printNode(child, options, indentLevel + 1);
        if (childOutput.trim()) {
          result += childIndent + childOutput.trim() + '\n';
        }
      }
      result += indent;
    } else {
      // Inline simple content
      for (const child of node.children) {
        result += printNode(child, options, indentLevel);
      }
    }
  }
  
  result += `</${node.tagName}>`;
  return result;
}

function formatTextNode(node: TextNode, options: PrinterOptions): string {
  if (options.preserveTeraWhitespace) {
    return node.value;
  }
  
  // Normalize whitespace but preserve intentional line breaks
  return node.value
    .replace(/\s+/g, ' ')
    .trim();
}

function printNode(node: TeraNode, options: PrinterOptions, indentLevel = 0): string {
  switch (node.type) {
    case 'root':
      return printRootNode(node as RootNode, options);
      
    case 'html':
      return formatHtmlNode(node as HtmlNode, options, indentLevel);
      
    case 'text':
      return formatTextNode(node as TextNode, options);
      
    case 'tera-expression':
      return formatTeraExpression(node as TeraExpressionNode, options);
      
    case 'tera-statement':
      return formatTeraStatement(node as TeraStatementNode, options);
      
    case 'tera-comment':
      return formatTeraComment(node as TeraCommentNode, options);
      
    case 'tera-block':
      return formatTeraBlock(node as TeraBlockNode, options, indentLevel);
      
    default:
      return '';
  }
}

function printRootNode(node: RootNode, options: PrinterOptions): string {
  const outputs: string[] = [];
  
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childOutput = printNode(child, options, 0);
    
    // Skip empty text nodes
    if (child.type === 'text' && !childOutput.trim()) {
      continue;
    }
    
    if (childOutput.trim()) {
      outputs.push(childOutput.trim());
    }
  }
  
  // Join with newlines and ensure single trailing newline
  let result = outputs.join('\n');
  if (result.length > 0) {
    result += '\n';
  }
  
  return result;
}

export function printTeraAst(
  ast: TeraNode, 
  options: Partial<PrinterOptions> = {}
): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return printNode(ast, mergedOptions);
}