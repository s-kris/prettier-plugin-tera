import { parseTeraTemplate } from './parser';
import { printTeraAst } from './printer';
import { TeraOptions } from './types';

export interface Plugin {
  languages: Array<{
    name: string;
    parsers: string[];
    extensions: string[];
    filenames?: string[];
  }>;
  parsers: Record<string, any>;
  printers: Record<string, any>;
  options?: Record<string, any>;
}

const plugin: Plugin = {
  languages: [
    {
      name: 'Tera',
      parsers: ['tera-template'],
      extensions: ['.tera', '.html.tera', '.jinja', '.jinja2', '.j2'],
      filenames: ['*.tera', '*.html.tera', '*.jinja', '*.jinja2', '*.j2']
    }
  ],
  parsers: {
    'tera-template': {
      parse: (text: string) => {
        return parseTeraTemplate(text);
      },
      astFormat: 'tera-ast',
      locStart: (node: any) => node.start || 0,
      locEnd: (node: any) => node.end || 0
    }
  },
  printers: {
    'tera-ast': {
      print: (path: any, options: any) => {
        return printTeraAst(path.getValue(), options);
      }
    }
  },
  options: {
    teraExpressionSpacing: {
      type: 'boolean',
      category: 'Tera',
      default: true,
      description: 'Add spaces inside Tera expression braces: {{ var }} vs {{var}}'
    },
    teraBlockIndentation: {
      type: 'int',
      category: 'Tera',
      default: 2,
      description: 'Number of spaces to indent Tera block content'
    },
    preserveTeraWhitespace: {
      type: 'boolean',
      category: 'Tera',
      default: false,
      description: 'Preserve original whitespace in text nodes'
    }
  }
};

module.exports = plugin;
export { parseTeraTemplate, printTeraAst };
export type { TeraOptions };