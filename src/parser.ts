import { parseDocument } from 'htmlparser2';
import { Element, Text, Comment, Node } from 'domhandler';
import { 
  TeraNode, 
  RootNode, 
  HtmlNode, 
  TextNode, 
  TeraExpressionNode,
  TeraStatementNode,
  TeraCommentNode,
  TeraBlockNode 
} from './types';

const TERA_EXPRESSION_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
const TERA_STATEMENT_REGEX = /\{\%\s*(.*?)\s*\%\}/g;
const TERA_COMMENT_REGEX = /\{\#\s*(.*?)\s*\#\}/g;
const TERA_BLOCK_KEYWORDS = ['if', 'for', 'macro', 'block', 'set', 'filter', 'raw'];
const TERA_END_KEYWORDS = ['endif', 'endfor', 'endmacro', 'endblock', 'endset', 'endfilter', 'endraw'];
const TERA_ELSE_KEYWORDS = ['else', 'elseif', 'elif'];

interface TokenMatch {
  type: 'expression' | 'statement' | 'comment';
  content: string;
  start: number;
  end: number;
  raw: string;
}

function tokenizeTeraConstructs(text: string): TokenMatch[] {
  const tokens: TokenMatch[] = [];
  
  // Find all Tera expressions {{ }}
  let match;
  while ((match = TERA_EXPRESSION_REGEX.exec(text)) !== null) {
    tokens.push({
      type: 'expression',
      content: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0]
    });
  }
  
  // Find all Tera statements {% %}
  TERA_STATEMENT_REGEX.lastIndex = 0;
  while ((match = TERA_STATEMENT_REGEX.exec(text)) !== null) {
    tokens.push({
      type: 'statement',
      content: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0]
    });
  }
  
  // Find all Tera comments {# #}
  TERA_COMMENT_REGEX.lastIndex = 0;
  while ((match = TERA_COMMENT_REGEX.exec(text)) !== null) {
    tokens.push({
      type: 'comment',
      content: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0]
    });
  }
  
  // Sort tokens by position
  return tokens.sort((a, b) => a.start - b.start);
}

function parseTeraExpression(content: string, start: number, end: number, raw: string): TeraExpressionNode {
  const parts = content.split('|').map(p => p.trim());
  const expression = parts[0];
  const filters = parts.length > 1 ? parts.slice(1) : undefined;
  
  return {
    type: 'tera-expression',
    expression,
    filters,
    start,
    end,
    raw
  };
}

function parseTeraStatement(content: string, start: number, end: number, raw: string): TeraStatementNode {
  const parts = content.split(/\s+/);
  const keyword = parts[0];
  
  return {
    type: 'tera-statement',
    statement: content,
    keyword,
    condition: parts.slice(1).join(' ') || undefined,
    start,
    end,
    raw
  };
}

function parseTeraComment(content: string, start: number, end: number, raw: string): TeraCommentNode {
  return {
    type: 'tera-comment',
    content,
    start,
    end,
    raw
  };
}

function parseTextWithTeraConstructs(text: string, startOffset = 0): TeraNode[] {
  const tokens = tokenizeTeraConstructs(text);
  const nodes: TeraNode[] = [];
  let lastEnd = 0;
  
  for (const token of tokens) {
    // Add text before the token
    if (token.start > lastEnd) {
      const textContent = text.slice(lastEnd, token.start);
      // Keep all text, even whitespace, to preserve formatting
      nodes.push({
        type: 'text',
        value: textContent,
        start: startOffset + lastEnd,
        end: startOffset + token.start
      });
    }
    
    // Add the Tera construct
    let teraNode: TeraNode;
    switch (token.type) {
      case 'expression':
        teraNode = parseTeraExpression(
          token.content, 
          startOffset + token.start, 
          startOffset + token.end,
          token.raw
        );
        break;
      case 'statement':
        teraNode = parseTeraStatement(
          token.content,
          startOffset + token.start,
          startOffset + token.end,
          token.raw
        );
        break;
      case 'comment':
        teraNode = parseTeraComment(
          token.content,
          startOffset + token.start,
          startOffset + token.end,
          token.raw
        );
        break;
    }
    nodes.push(teraNode);
    lastEnd = token.end;
  }
  
  // Add remaining text
  if (lastEnd < text.length) {
    const textContent = text.slice(lastEnd);
    nodes.push({
      type: 'text',
      value: textContent,
      start: startOffset + lastEnd,
      end: startOffset + text.length
    });
  }
  
  return nodes;
}

function convertDomNodeToTeraNode(domNode: Node): TeraNode[] {
  if (domNode instanceof Text) {
    return parseTextWithTeraConstructs(domNode.data);
  }
  
  if (domNode instanceof Element) {
    const htmlNode: HtmlNode = {
      type: 'html',
      tagName: domNode.name,
      attributes: Object.entries(domNode.attribs || {}).map(([name, value]) => ({
        name,
        value: value as string
      })),
      children: [],
      selfClosing: domNode.children.length === 0,
      start: 0, // Will be set properly in full implementation
      end: 0    // Will be set properly in full implementation
    };
    
    if (domNode.children && domNode.children.length > 0) {
      const childNodes: TeraNode[] = [];
      for (const child of domNode.children) {
        childNodes.push(...convertDomNodeToTeraNode(child));
      }
      // Parse block structure for this HTML node's children
      htmlNode.children = parseTeraBlockStructure(childNodes);
    }
    
    return [htmlNode];
  }
  
  if (domNode instanceof Comment) {
    return [{
      type: 'text',
      value: `<!--${domNode.data}-->`,
      start: 0,
      end: 0
    }];
  }
  
  return [];
}

function parseTeraBlockStructure(nodes: TeraNode[]): TeraNode[] {
  const result: TeraNode[] = [];
  const stack: { node: TeraBlockNode; startIndex: number }[] = [];
  const processedIndices = new Set<number>();
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    if (node.type === 'tera-statement') {
      const parts = node.statement.split(/\s+/);
      const keyword = parts[0];
      
      // Check if this is a block start
      if (TERA_BLOCK_KEYWORDS.includes(keyword)) {
        const blockNode: TeraBlockNode = {
          type: 'tera-block',
          keyword,
          name: node.condition,
          children: [],
          start: node.start,
          end: node.end,
          raw: node.raw
        };
        
        if (stack.length > 0) {
          // Add to parent block
          stack[stack.length - 1].node.children.push(blockNode);
        } else {
          // Add to result
          result.push(blockNode);
        }
        
        stack.push({ node: blockNode, startIndex: i });
        processedIndices.add(i);
      }
      // Check if this is a block end
      else if (keyword === 'endblock' || keyword.startsWith('end')) {
        // Handle both {% endblock %} and {% endblock name %}
        let blockType: string;
        let blockName: string | undefined;
        
        if (keyword === 'endblock') {
          blockType = 'block';
          blockName = parts[1]; // Could be the block name
        } else {
          blockType = keyword.substring(3);
        }
        
        // Find matching block in stack
        let matched = false;
        for (let j = stack.length - 1; j >= 0; j--) {
          const stackItem = stack[j];
          if (stackItem.node.keyword === blockType) {
            // For named blocks, check if names match
            if (blockType === 'block' && blockName && stackItem.node.name !== blockName) {
              continue;
            }
            
            // Update the end position of the block
            stackItem.node.end = node.end;
            stack.splice(j, 1);
            matched = true;
            processedIndices.add(i);
            break;
          }
        }
        
        if (!matched) {
          // Orphaned endblock - only add if we're not inside any block
          if (stack.length === 0) {
            result.push(node);
          }
        }
      }
      // Handle else/elif
      else if (TERA_ELSE_KEYWORDS.includes(keyword) && stack.length > 0) {
        const parent = stack[stack.length - 1].node;
        if (parent.keyword === 'if') {
          parent.children.push(node);
          processedIndices.add(i);
        } else {
          if (stack.length === 0) {
            result.push(node);
          }
        }
      }
      else {
        // Regular statement - only add if not processed
        if (!processedIndices.has(i)) {
          if (stack.length > 0) {
            stack[stack.length - 1].node.children.push(node);
          } else {
            result.push(node);
          }
        }
      }
    } else {
      // Non-statement nodes
      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
      } else {
        result.push(node);
      }
    }
  }
  
  return result;
}

export function parseTeraTemplate(text: string): RootNode {
  const document = parseDocument(text, {
    lowerCaseAttributeNames: false,
    decodeEntities: true
  });
  
  const children: TeraNode[] = [];
  
  for (const domNode of document.children) {
    children.push(...convertDomNodeToTeraNode(domNode));
  }
  
  // Parse block structure
  const structuredChildren = parseTeraBlockStructure(children);
  
  return {
    type: 'root',
    children: structuredChildren,
    start: 0,
    end: text.length
  };
}