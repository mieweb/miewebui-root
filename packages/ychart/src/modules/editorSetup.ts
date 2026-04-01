/**
 * CodeMirror editor setup: YAML linter, error banner, and formatting.
 */
import { EditorView, basicSetup } from 'codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import * as jsyaml from 'js-yaml';
import { escapeRegex } from './utils';
import type { FrontMatter, YChartOptions } from './types';

export interface EditorSetupContext {
  instanceId: string;
  getEditorContainer: () => HTMLElement | null;
  getErrorBanner: () => HTMLElement | null;
  getEditor: () => EditorView | null;
  getOrgChart: () => any;
  getDefaultOptions: () => YChartOptions;
  parseFrontMatter: (content: string) => FrontMatter;
  renderChart: () => void;
  isUpdatingProgrammatically: () => boolean;
}

/**
 * Create a CodeMirror YAML linter extension that validates syntax and structure.
 */
export function createYamlLinter(
  parseFrontMatter: (content: string) => FrontMatter,
  onDiagnostics: (diagnostics: Diagnostic[], view: EditorView) => void,
): ReturnType<typeof linter> {
  return linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const content = view.state.doc.toString();

    try {
      const { data: yamlData } = parseFrontMatter(content);
      const parsed = jsyaml.load(yamlData);

      if (parsed !== null && parsed !== undefined && !Array.isArray(parsed)) {
        const dataStart = content.lastIndexOf('---');
        const pos = dataStart !== -1 ? dataStart + 3 : 0;
        diagnostics.push({
          from: pos,
          to: Math.min(pos + 50, content.length),
          severity: 'error',
          message: 'YAML data must be an array of objects (start each item with "- ")',
        });
      } else if (Array.isArray(parsed)) {
        // Check for duplicate IDs
        const idCounts = new Map<string, number[]>();
        let itemIndex = 0;
        for (const item of parsed) {
          if (item.id !== undefined && item.id !== null) {
            const idStr = String(item.id);
            if (!idCounts.has(idStr)) {
              idCounts.set(idStr, []);
            }
            idCounts.get(idStr)!.push(itemIndex);
          }
          itemIndex++;
        }

        for (const [id, indices] of idCounts) {
          if (indices.length > 1) {
            for (let i = 1; i < indices.length; i++) {
              const idPattern = new RegExp(`^-\\s*id:\\s*${escapeRegex(String(id))}\\s*$`, 'gm');
              let match;
              let matchCount = 0;
              let errorPos = 0;
              let errorEnd = content.length;

              while ((match = idPattern.exec(content)) !== null) {
                if (matchCount === i) {
                  errorPos = match.index;
                  errorEnd = match.index + match[0].length;
                  break;
                }
                matchCount++;
              }

              const lineNumber = content.substring(0, errorPos).split('\n').length;
              diagnostics.push({
                from: errorPos,
                to: errorEnd,
                severity: 'warning',
                message: `Line ${lineNumber}: Duplicate id "${id}" - this node will be ignored (first occurrence at position ${indices[0] + 1} will be used)`,
              });
            }
          }
        }

        // Check for duplicate names in name-based format
        const nameCounts = new Map<string, number[]>();
        itemIndex = 0;
        for (const item of parsed) {
          if (item.name !== undefined && item.name !== null) {
            const nameStr = String(item.name).toLowerCase();
            if (!nameCounts.has(nameStr)) {
              nameCounts.set(nameStr, []);
            }
            nameCounts.get(nameStr)!.push(itemIndex);
          }
          itemIndex++;
        }

        const hasNameField = parsed.some((item: any) => item.name !== undefined);
        const hasIdField = parsed.some((item: any) => item.id !== undefined);
        const usesNameFormat = hasNameField && !hasIdField;

        if (usesNameFormat) {
          for (const [, indices] of nameCounts) {
            if (indices.length > 1) {
              for (let i = 1; i < indices.length; i++) {
                const item = parsed[indices[i]];
                const namePattern = new RegExp(`^-\\s*name:\\s*${escapeRegex(item.name)}`, 'gm');
                let match;
                let matchCount = 0;
                let errorPos = 0;
                let errorEnd = content.length;

                while ((match = namePattern.exec(content)) !== null) {
                  if (matchCount === i) {
                    errorPos = match.index;
                    errorEnd = match.index + match[0].length;
                    break;
                  }
                  matchCount++;
                }

                const lineNumber = content.substring(0, errorPos).split('\n').length;
                diagnostics.push({
                  from: errorPos,
                  to: errorEnd,
                  severity: 'warning',
                  message: `Line ${lineNumber}: Duplicate name "${item.name}" - this node will be ignored (first occurrence will be used)`,
                });
              }
            }
          }
        }

        if (usesNameFormat) {
          // Multiple root nodes are supported — no errors for name-based format
        } else {
          // Validate id/parentId format
          const nodeIds = new Set<string>();
          for (const item of parsed as any[]) {
            if (item.id !== undefined && item.id !== null) {
              nodeIds.add(String(item.id));
            }
            if (item.email) {
              nodeIds.add(String(item.email).toLowerCase());
            }
          }

          for (const item of parsed as any[]) {
            const parentId = item.parentId;
            if (
              parentId !== null &&
              parentId !== undefined &&
              !nodeIds.has(String(parentId)) &&
              !nodeIds.has(String(parentId).toLowerCase())
            ) {
              const itemIdPattern = new RegExp(`^-\\s*id:\\s*${item.id}\\s*$`, 'm');
              const parentIdPattern = new RegExp(`parentId:\\s*${parentId}`, 'm');

              const itemMatch = content.match(itemIdPattern);
              let errorPos = 0;
              let errorEnd = content.length;

              if (itemMatch && itemMatch.index !== undefined) {
                const afterId = content.substring(itemMatch.index);
                const parentIdMatch = afterId.match(parentIdPattern);
                if (parentIdMatch && parentIdMatch.index !== undefined) {
                  errorPos = itemMatch.index + parentIdMatch.index;
                  errorEnd = errorPos + parentIdMatch[0].length;
                }
              }

              const lineNumber = content.substring(0, errorPos).split('\n').length;
              diagnostics.push({
                from: errorPos,
                to: errorEnd,
                severity: 'error',
                message: `Line ${lineNumber}: Invalid parentId "${parentId}" - no node with this id exists`,
              });
            }
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof jsyaml.YAMLException) {
        const mark = e.mark;
        if (mark) {
          const line = Math.min(mark.line + 1, view.state.doc.lines);
          const lineInfo = view.state.doc.line(line);
          const from = lineInfo.from + Math.min(mark.column, lineInfo.length);
          const to = lineInfo.to;
          diagnostics.push({ from, to, severity: 'error', message: `Line ${line}: ${e.reason || e.message}` });
        } else {
          diagnostics.push({
            from: 0,
            to: Math.min(50, content.length),
            severity: 'error',
            message: e.message,
          });
        }
      } else if (e instanceof Error) {
        diagnostics.push({
          from: 0,
          to: Math.min(50, content.length),
          severity: 'error',
          message: e.message,
        });
      }
    }

    onDiagnostics(diagnostics, view);
    return diagnostics;
  }, { delay: 300 });
}

/**
 * Create a configured CodeMirror EditorView.
 */
export function createEditor(
  container: HTMLElement,
  initialData: string,
  theme: string | undefined,
  parseFrontMatter: (content: string) => FrontMatter,
  onDiagnostics: (diagnostics: Diagnostic[], view: EditorView) => void,
  onDocChanged: () => void,
): EditorView {
  const yamlLinter = createYamlLinter(parseFrontMatter, onDiagnostics);

  const extensions = [
    basicSetup,
    yaml(),
    lintGutter(),
    yamlLinter,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChanged();
      }
    }),
  ];

  if (theme === 'dark') {
    extensions.push(oneDark);
  }

  extensions.push(
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
    }),
  );

  const editor = new EditorView({
    doc: initialData,
    extensions,
    parent: container,
  });

  // Force refresh after short delay
  setTimeout(() => editor.requestMeasure(), 100);

  return editor;
}

/**
 * Update the error banner with current diagnostics.
 */
export function updateErrorBanner(
  banner: HTMLElement,
  diagnostics: Diagnostic[],
  view: EditorView,
  jumpToLine: (lineNumber: number) => void,
): void {
  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'block';
  banner.innerHTML = '';

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: var(--yc-spacing-md);
    margin-bottom: 6px;
    font-weight: var(--yc-font-weight-semibold);
    color: var(--yc-color-error-red-dark);
  `;
  header.innerHTML = `
    <span style="font-size: var(--yc-font-size-xl);">⚠️</span>
    <span>${errors.length} error${errors.length !== 1 ? 's' : ''}${warnings.length > 0 ? `, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}` : ''}</span>
  `;
  banner.appendChild(header);

  const allDiagnostics = [...errors, ...warnings];
  allDiagnostics.forEach((diagnostic, index) => {
    const errorItem = document.createElement('div');
    errorItem.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: var(--yc-spacing-md);
      padding: 4px 0;
      ${index < allDiagnostics.length - 1 ? 'border-bottom: 1px solid rgba(239, 68, 68, 0.2);' : ''}
    `;

    const lineMatch = diagnostic.message.match(/^Line (\d+):/);
    let lineNumber: number;
    let displayMessage: string;

    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
      displayMessage = diagnostic.message.replace(/^Line \d+:\s*/, '');
    } else {
      const doc = view.state.doc;
      lineNumber = doc.lineAt(diagnostic.from).number;
      displayMessage = diagnostic.message;
    }

    const jumpBtn = document.createElement('button');
    jumpBtn.textContent = `L${lineNumber}`;
    jumpBtn.title = `Jump to line ${lineNumber}`;
    jumpBtn.style.cssText = `
      background: ${diagnostic.severity === 'error' ? 'var(--yc-color-error-red-light)' : 'var(--yc-color-warning-amber-dark)'};
      color: white;
      border: none;
      border-radius: var(--yc-border-radius-sm);
      padding: 2px 8px;
      font-size: var(--yc-font-size-xs);
      font-weight: var(--yc-font-weight-semibold);
      cursor: pointer;
      flex-shrink: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    `;
    jumpBtn.onmouseover = () => {
      jumpBtn.style.background =
        diagnostic.severity === 'error'
          ? 'var(--yc-color-error-red-dark)'
          : 'var(--yc-color-warning-amber-darker)';
    };
    jumpBtn.onmouseleave = () => {
      jumpBtn.style.background =
        diagnostic.severity === 'error'
          ? 'var(--yc-color-error-red-light)'
          : 'var(--yc-color-warning-amber-dark)';
    };
    jumpBtn.onclick = () => jumpToLine(lineNumber);

    const messageSpan = document.createElement('span');
    messageSpan.textContent = displayMessage;
    messageSpan.style.cssText = `
      color: var(--yc-color-error-red-text);
      flex: 1;
      word-break: break-word;
    `;

    errorItem.appendChild(jumpBtn);
    errorItem.appendChild(messageSpan);
    banner.appendChild(errorItem);
  });
}

/**
 * Jump to a specific line in the editor.
 */
export function jumpToEditorLine(editor: EditorView, lineNumber: number): void {
  const doc = editor.state.doc;
  const line = doc.line(Math.min(lineNumber, doc.lines));

  editor.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
    effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
  });

  editor.focus();
}

/**
 * Format the YAML content in the editor (preserving front matter structure).
 */
export function formatYAML(editor: EditorView): void {
  try {
    const currentContent = editor.state.doc.toString();

    if (currentContent.startsWith('---')) {
      const parts = currentContent.split('---');
      if (parts.length >= 3) {
        const frontMatter = parts[1].trim();
        const dataContent = parts.slice(2).join('---').trim();

        const parsedFrontMatter = jsyaml.load(frontMatter) as any;
        const cardTemplate = parsedFrontMatter?.card || null;

        if (parsedFrontMatter && parsedFrontMatter.card) {
          delete parsedFrontMatter.card;
        }

        const formattedFrontMatter = jsyaml.dump(parsedFrontMatter, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        });

        const parsedData = jsyaml.load(dataContent);
        const formattedData = jsyaml.dump(parsedData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        });

        let cardYaml = '';
        if (cardTemplate) {
          const cardMatch = frontMatter.match(/^card:\s*\n((?:[ \t]+.*\n?)*)/m);
          if (cardMatch) {
            cardYaml = 'card:\n' + cardMatch[1];
          }
        }

        let reconstructedFrontMatter = formattedFrontMatter.trim();
        if (cardYaml) {
          reconstructedFrontMatter += '\n' + cardYaml.trim();
        }

        const formatted = `---\n${reconstructedFrontMatter}\n---\n\n${formattedData.trim()}\n`;

        editor.dispatch({
          changes: { from: 0, to: editor.state.doc.length, insert: formatted },
        });
      }
    } else {
      const parsed = jsyaml.load(currentContent);
      const formatted = jsyaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: formatted },
      });
    }

    console.log('YAML formatted successfully');
  } catch (error) {
    console.error('Failed to format YAML:', error);
    alert(`Failed to format YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Scroll the editor to a node entry identified by its ID.
 */
export function scrollToNodeInEditor(editor: EditorView, selectedNodeId: any): void {
  if (!selectedNodeId) {
    console.log('No node selected');
    return;
  }

  console.log('Finding node with ID:', selectedNodeId);

  const content = editor.state.doc.toString();
  const idPattern = new RegExp(`^-?\\s*id:\\s*${selectedNodeId}\\s*$`, 'm');
  const match = content.match(idPattern);

  if (match && match.index !== undefined) {
    let blockStart = match.index;
    const beforeMatch = content.substring(0, match.index);
    const lastDash = beforeMatch.lastIndexOf('\n- ');
    if (lastDash !== -1) {
      blockStart = lastDash + 1;
    }

    const lineNumber = content.substring(0, blockStart).split('\n').length;
    const line = editor.state.doc.line(lineNumber);

    editor.dispatch({
      selection: { anchor: line.from, head: line.to },
      scrollIntoView: true,
    });

    editor.focus();
    console.log(`Scrolled to node ${selectedNodeId} at line ${lineNumber}`);
  } else {
    console.log(`Node with ID ${selectedNodeId} not found in YAML`);
  }
}
