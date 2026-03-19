/**
 * Layout builder — creates the DOM structure for the YChart editor.
 * Extracted from YChartEditor.createLayout() to reduce main class size.
 */

export interface LayoutElements {
  chartWrapper: HTMLElement;
  chartContainer: HTMLElement;
  detailsPanel: HTMLElement;
  editorSidebar: HTMLElement;
  errorBanner: HTMLElement;
  editorContainer: HTMLElement;
}

export interface LayoutConfig {
  instanceId: string;
  collapsible: boolean;
  onToggleEditor: () => void;
  onFormatYAML: () => void;
}

/**
 * Build the main layout DOM structure inside a view container.
 * Returns references to key elements for the caller to wire up.
 */
export function buildLayout(viewContainer: HTMLElement, config: LayoutConfig): LayoutElements {
  const { instanceId, collapsible, onToggleEditor, onFormatYAML } = config;

  // Clear container and add scoping class
  viewContainer.innerHTML = '';
  viewContainer.classList.add('ychart-container');
  viewContainer.style.cssText = 'display:flex;width:100%;height:100%;min-height:0;position:relative;overflow:hidden;';

  // Chart wrapper (left side)
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'ychart-chart-wrapper';
  chartWrapper.style.cssText = 'flex:1;min-width:0;min-height:0;height:100%;position:relative;display:flex;flex-direction:column;overflow:hidden;';

  const chartContainer = document.createElement('div');
  chartContainer.id = `ychart-chart-${instanceId}`;
  chartContainer.className = 'ychart-chart';
  chartContainer.setAttribute('data-id', `ychart-chart-${instanceId}`);
  chartContainer.style.cssText = 'flex:1;width:100%;min-height:0;position:relative;overflow:hidden;';
  chartWrapper.appendChild(chartContainer);

  // Details panel (absolute overlay)
  const detailsPanel = document.createElement('div');
  detailsPanel.id = `ychart-node-details-${instanceId}`;
  detailsPanel.setAttribute('data-id', `ychart-node-details-${instanceId}`);
  detailsPanel.style.cssText = `
    display: none;
    position: absolute;
    right: var(--yc-spacing-4xl);
    top: var(--yc-spacing-4xl);
    background: var(--yc-color-bg-card);
    border: var(--yc-border-width-medium) solid var(--yc-color-primary);
    border-radius: var(--yc-border-radius-lg);
    padding: var(--yc-spacing-5xl);
    box-shadow: var(--yc-shadow-lg);
    max-width: var(--yc-width-detail-panel);
    max-height: 80%;
    overflow-y: auto;
    z-index: var(--yc-z-index-detail-panel);
  `;
  chartWrapper.appendChild(detailsPanel);

  // Editor sidebar (right side)
  const editorSidebar = document.createElement('div');
  editorSidebar.id = `ychart-editor-sidebar-${instanceId}`;
  editorSidebar.className = 'ychart-editor-panel';
  editorSidebar.setAttribute('data-id', `ychart-editor-sidebar-${instanceId}`);
  editorSidebar.style.cssText = `
    width: var(--yc-width-sidebar);
    height: 100%;
    min-height: 0;
    border-left: var(--yc-border-width-thin) solid var(--yc-color-gray-500);
    overflow: hidden;
    position: relative;
    transition: width var(--yc-transition-normal), border-left-width 0s 0.3s;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  `;

  // Error banner
  const errorBanner = document.createElement('div');
  errorBanner.id = `ychart-error-banner-${instanceId}`;
  errorBanner.className = 'ychart-error-banner';
  errorBanner.style.cssText = `
    display: none;
    background: var(--yc-gradient-error);
    border-bottom: var(--yc-border-width-medium) solid var(--yc-color-error-border);
    padding: var(--yc-spacing-md) var(--yc-spacing-xl);
    max-height: var(--yc-height-error-banner-max);
    overflow-y: auto;
    font-family: var(--yc-font-family-base);
    font-size: var(--yc-font-size-base);
  `;
  editorSidebar.appendChild(errorBanner);

  // Editor header with format button
  const editorHeader = document.createElement('div');
  editorHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--yc-spacing-md) var(--yc-spacing-xl);
    background: var(--yc-color-editor-bg);
    border-bottom: var(--yc-border-width-thin) solid var(--yc-color-editor-border);
  `;

  const editorTitle = document.createElement('div');
  editorTitle.textContent = 'YAML Editor';
  editorTitle.style.cssText = 'color: var(--yc-color-editor-text); font-size: var(--yc-font-size-sm); font-weight: var(--yc-font-weight-semibold);';
  editorHeader.appendChild(editorTitle);

  const formatBtn = document.createElement('button');
  formatBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
    <span style="margin-left: var(--yc-spacing-xs);">Format</span>
  `;
  formatBtn.style.cssText = `
    display: flex;
    align-items: center;
    background: var(--yc-color-primary);
    color: white;
    border: none;
    padding: var(--yc-spacing-xs) var(--yc-spacing-md);
    border-radius: var(--yc-border-radius-sm);
    cursor: pointer;
    font-size: var(--yc-font-size-xs);
    transition: background var(--yc-transition-fast);
  `;
  formatBtn.onmouseenter = () => { formatBtn.style.background = 'var(--yc-color-primary-dark)'; };
  formatBtn.onmouseleave = () => { formatBtn.style.background = 'var(--yc-color-primary)'; };
  formatBtn.onclick = () => onFormatYAML();
  editorHeader.appendChild(formatBtn);
  editorSidebar.appendChild(editorHeader);

  // Editor container
  const editorContainer = document.createElement('div');
  editorContainer.id = `ychart-editor-${instanceId}`;
  editorContainer.className = 'ychart-editor';
  editorContainer.setAttribute('data-id', `ychart-editor-${instanceId}`);
  editorContainer.style.cssText = 'width:100%;flex:1;min-height:0;overflow:hidden;';
  editorSidebar.appendChild(editorContainer);

  // Collapse button
  if (collapsible) {
    const collapseBtn = document.createElement('button');
    collapseBtn.setAttribute('data-id', `ychart-collapse-editor-${instanceId}`);
    collapseBtn.innerHTML = '▶';
    collapseBtn.style.cssText = `
      position: absolute;
      right: 399px;
      top: var(--yc-spacing-lg);
      z-index: var(--yc-z-index-collapse-button);
      background: var(--yc-color-primary);
      color: white;
      border: none;
      padding: var(--yc-spacing-md) var(--yc-spacing-sm);
      cursor: pointer;
      border-radius: var(--yc-border-radius-left);
      font-size: var(--yc-font-size-sm);
      transition: right var(--yc-transition-normal);
      box-shadow: var(--yc-shadow-sm);
    `;
    collapseBtn.onclick = () => onToggleEditor();
    viewContainer.appendChild(collapseBtn);
  }

  // Assemble: chart first, then editor
  viewContainer.appendChild(chartWrapper);
  viewContainer.appendChild(editorSidebar);

  return { chartWrapper, chartContainer, detailsPanel, editorSidebar, errorBanner, editorContainer };
}
