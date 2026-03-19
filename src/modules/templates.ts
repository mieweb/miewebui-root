import { escapeHtml } from './utils';
import type { CardElement, CardConfig } from './types';

/**
 * Replace $fieldName$ variables in a template string with data values.
 * All values are HTML-escaped to prevent XSS.
 */
export function replaceVariables(template: string, data: any): string {
  return template.replace(/\$(\w+)\$/g, (_match, fieldName) => {
    const value = data[fieldName];
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return escapeHtml(String(value));
  });
}

/**
 * Render a card element from YAML front matter card template definition.
 * Recursively renders children elements.
 */
export function renderCardElement(element: CardElement, data: any): string {
  const tagName = Object.keys(element)[0];
  const config = element[tagName];

  // If config is a string, it's simple content
  if (typeof config === 'string') {
    const content = replaceVariables(config, data);
    if (tagName === 'span') {
      return `<${tagName} style="word-break:break-all">${content}</${tagName}>`;
    }
    return `<${tagName}>${content}</${tagName}>`;
  }

  // Otherwise, it's a CardConfig object
  const cardConfig = config as CardConfig;
  const attrs: string[] = [];
  let content = '';
  let children = '';

  if (cardConfig.class) {
    attrs.push(`class="${cardConfig.class}"`);
  }

  if (cardConfig.style) {
    if (tagName === 'span') {
      const existingStyle = cardConfig.style.trim();
      const separator = existingStyle.endsWith(';') ? '' : ';';
      attrs.push(`style="${existingStyle}${separator}word-break:break-all"`);
    } else {
      attrs.push(`style="${cardConfig.style}"`);
    }
  } else if (tagName === 'span') {
    attrs.push(`style="word-break:break-all"`);
  }

  if (cardConfig.content) {
    content = replaceVariables(cardConfig.content, data);
  }

  if (cardConfig.children && Array.isArray(cardConfig.children)) {
    children = cardConfig.children
      .map(child => renderCardElement(child, data))
      .join('');
  }

  const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  return `<${tagName}${attrsStr}>${content}${children}</${tagName}>`;
}
