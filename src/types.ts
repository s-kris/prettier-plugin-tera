export interface TeraOptions {
  teraExpressionSpacing?: boolean;
  teraBlockIndentation?: number;
  preserveTeraWhitespace?: boolean;
}

export type NodeType = 
  | 'root'
  | 'html'
  | 'text' 
  | 'tera-expression'
  | 'tera-statement'
  | 'tera-comment'
  | 'tera-block';

export interface BaseNode {
  type: NodeType;
  start: number;
  end: number;
  raw?: string;
}

export interface RootNode extends BaseNode {
  type: 'root';
  children: TeraNode[];
}

export interface HtmlNode extends BaseNode {
  type: 'html';
  tagName?: string;
  attributes?: Array<{ name: string; value?: string }>;
  children?: TeraNode[];
  selfClosing?: boolean;
}

export interface TextNode extends BaseNode {
  type: 'text';
  value: string;
}

export interface TeraExpressionNode extends BaseNode {
  type: 'tera-expression';
  expression: string;
  filters?: string[];
}

export interface TeraStatementNode extends BaseNode {
  type: 'tera-statement';
  statement: string;
  keyword: string;
  condition?: string;
  children?: TeraNode[];
}

export interface TeraCommentNode extends BaseNode {
  type: 'tera-comment';
  content: string;
}

export interface TeraBlockNode extends BaseNode {
  type: 'tera-block';
  keyword: string;
  name?: string;
  children: TeraNode[];
}

export type TeraNode = 
  | RootNode
  | HtmlNode 
  | TextNode
  | TeraExpressionNode
  | TeraStatementNode
  | TeraCommentNode
  | TeraBlockNode;