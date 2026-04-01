import * as jsyaml from 'js-yaml';
import type { FrontMatter, FieldSchema, SchemaDefinition } from './types';

/**
 * Parse a schema field definition string.
 * 
 * Supported formats:
 *   1. Basic: "string | required"
 *   2. Bracket aliases: "[ supervisor | leader | manager ] string | optional"
 *   3. Alias keyword: "string | optional | alias: leader, manager, reports_to"
 *   4. Aliases array: "string | optional | aliases[leader, manager]"
 */
export function parseSchemaField(fieldDefinition: string, _fieldName?: string): FieldSchema {
  let aliases: string[] | undefined;
  let workingDef = fieldDefinition;
  
  // Check for bracket alias syntax: [ field1 | field2 | field3 ]
  const bracketMatch = workingDef.match(/^\s*\[\s*(.+?)\s*\]\s*(.*)$/);
  if (bracketMatch) {
    const aliasesStr = bracketMatch[1];
    workingDef = bracketMatch[2];
    
    // Parse aliases (split by |)
    const aliasParts = aliasesStr.split('|').map(p => p.trim()).filter(p => p);
    aliases = aliasParts.slice(1); // First one is the primary field name
  }
  
  // Check for "alias:" or "aliases:" keyword syntax
  const aliasKeywordMatch = workingDef.match(/\|\s*alias(?:es)?:\s*([^|]+)/i);
  if (aliasKeywordMatch) {
    const aliasStr = aliasKeywordMatch[1];
    const parsedAliases = aliasStr.split(',').map(a => a.trim()).filter(a => a);
    aliases = aliases ? [...aliases, ...parsedAliases] : parsedAliases;
    workingDef = workingDef.replace(/\|\s*alias(?:es)?:\s*[^|]+/i, '');
  }
  
  // Check for "aliases[...]" syntax
  const aliasArrayMatch = workingDef.match(/\|\s*aliases?\s*\[\s*([^\]]+)\s*\]/i);
  if (aliasArrayMatch) {
    const aliasStr = aliasArrayMatch[1];
    const parsedAliases = aliasStr
      .split(',')
      .map(a => a.trim().replace(/^["']|["']$/g, ''))
      .filter(a => a);
    aliases = aliases ? [...aliases, ...parsedAliases] : parsedAliases;
    workingDef = workingDef.replace(/\|\s*aliases?\s*\[[^\]]+\]/i, '');
  }
  
  // Parse remaining parts for type, required, etc.
  const parts = workingDef.split('|').map(p => p.trim()).filter(p => p);
  const type = parts.find(p => !['required', 'optional', 'missing'].includes(p.toLowerCase())) || 'string';
  
  return {
    type,
    required: parts.some(p => p.toLowerCase() === 'required'),
    missing: parts.some(p => p.toLowerCase() === 'missing'),
    aliases: aliases && aliases.length > 0 ? aliases : undefined
  };
}

/**
 * Parse YAML content with front matter support.
 * 
 * @param content - Raw YAML string, optionally with front matter delimited by ---
 * @param supervisorFields - Current supervisor field aliases (may be updated by schema)
 * @returns Parsed front matter with options, schema, card template, data, and updated supervisor fields
 */
export function parseFrontMatter(
  content: string,
  _supervisorFields: string[]
): FrontMatter & { updatedSupervisorFields?: string[] } {
  if (content.startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      const frontMatter = parts[1].trim();
      const yamlData = parts.slice(2).join('---').trim();
      
      try {
        const parsed = jsyaml.load(frontMatter) as any;
        const options = parsed.options || {};
        const cardDef = parsed.card || null;
        const schemaDef: SchemaDefinition = {};
        let updatedSupervisorFields: string[] | undefined;
        
        if (parsed.schema && typeof parsed.schema === 'object') {
          for (const [fieldName, fieldDef] of Object.entries(parsed.schema)) {
            if (typeof fieldDef === 'string') {
              const fieldSchema = parseSchemaField(fieldDef as string, fieldName);
              schemaDef[fieldName] = fieldSchema;
              
              // If this field has aliases, also add the aliases to schema
              if (fieldSchema.aliases && fieldSchema.aliases.length > 0) {
                for (const alias of fieldSchema.aliases) {
                  schemaDef[alias] = { ...fieldSchema, aliases: [fieldName] };
                }
              }
            }
          }
          
          // Update supervisor fields based on schema aliases for 'supervisor' field
          if (schemaDef.supervisor && schemaDef.supervisor.aliases) {
            updatedSupervisorFields = ['supervisor', ...schemaDef.supervisor.aliases];
          }
        }
        
        return { options, schema: schemaDef, card: cardDef, data: yamlData, updatedSupervisorFields };
      } catch (error) {
        // Silently handle - linter will display errors in the editor
        return { options: {}, schema: {}, card: undefined, data: content };
      }
    }
  }
  return { options: {}, schema: {}, card: undefined, data: content };
}
