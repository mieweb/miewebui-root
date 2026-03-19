/**
 * Toolbar creation and positioning logic for YChart.
 * Extracted from YChartEditor to reduce file size.
 */

type ToolbarPosition = 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'topcenter' | 'bottomcenter';
type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarConfig {
  instanceId: string;
  position: ToolbarPosition;
  orientation: ToolbarOrientation;
  experimental: boolean;
  currentView: 'hierarchy' | 'force';
  swapModeEnabled: boolean;
  columnAdjustMode: boolean;
  actions: {
    handleFit: () => void;
    handleReset: () => void;
    handleExpandAll: () => void;
    handleCollapseAll: () => void;
    handleColumnAdjustToggle: () => void;
    handleSwapToggle: () => void;
    handleExport: () => void;
    handleToggleView: () => void;
  };
}

function getToolbarPositionStyles(position: ToolbarPosition): string {
  const margin = 'var(--yc-spacing-4xl)';
  const topMargin = 'calc(var(--yc-spacing-4xl) + 50px)';

  switch (position) {
    case 'topleft':
      return `top: ${topMargin}; left: ${margin};`;
    case 'topright':
      return `top: ${margin}; right: ${margin};`;
    case 'bottomleft':
      return `bottom: ${margin}; left: ${margin};`;
    case 'bottomright':
      return `bottom: ${margin}; right: ${margin};`;
    case 'topcenter':
      return `top: ${topMargin}; left: 50%; transform: translateX(-50%);`;
    case 'bottomcenter':
      return `bottom: ${margin}; left: 50%; transform: translateX(-50%);`;
    default:
      return `bottom: ${margin}; left: ${margin};`;
  }
}

function getTooltipPosition(position: ToolbarPosition, orientation: ToolbarOrientation): string {
  const isVertical = orientation === 'vertical';

  if (isVertical) {
    if (position.includes('left')) {
      return `left: calc(100% + var(--yc-spacing-md)); top: 50%; transform: translateY(-50%) scale(0.8);`;
    }
    return `right: calc(100% + var(--yc-spacing-md)); top: 50%; transform: translateY(-50%) scale(0.8);`;
  }

  if (position.includes('top')) {
    return `top: calc(100% + var(--yc-spacing-md)); left: 50%; transform: translateX(-50%) scale(0.8);`;
  }

  return `bottom: calc(100% + var(--yc-spacing-md)); left: 50%; transform: translateX(-50%) scale(0.8);`;
}

/** SVG icon definitions for toolbar buttons */
const icons = {
  reset: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
  fit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
  export: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 15V3"/></svg>`,
  swap: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16"/></svg>`,
  forceGraph: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><line x1="12" y1="7" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="14" y1="12" x2="17" y2="12"/><line x1="7" y1="12" x2="10" y2="12"/></svg>`,
  orgChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  expandAll: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  collapseAll: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  columnAdjust: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/><line x1="6.5" y1="8" x2="6.5" y2="16"/><line x1="17.5" y1="8" x2="17.5" y2="16"/></svg>`,
  search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
};

export { icons as toolbarIcons };

/**
 * Create the floating toolbar element with all chart action buttons.
 */
export function createToolbar(config: ToolbarConfig): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.setAttribute('data-id', `ychart-toolbar-${config.instanceId}`);

  const positionStyles = getToolbarPositionStyles(config.position);
  const orientation = config.orientation === 'vertical' ? 'column' : 'row';

  toolbar.style.cssText = `
    position: absolute;
    ${positionStyles}
    display: flex;
    flex-direction: ${orientation};
    gap: var(--yc-spacing-md);
    background: var(--yc-color-overlay-bg);
    backdrop-filter: var(--yc-backdrop-blur);
    border-radius: var(--yc-border-radius-xl);
    padding: var(--yc-spacing-md);
    box-shadow: var(--yc-shadow-2xl);
    z-index: var(--yc-z-index-toolbar);
    border: var(--yc-border-width-thin) solid var(--yc-color-shadow-light);
  `;

  const buttons = [
    { id: 'fit', icon: icons.fit, tooltip: 'Fit to Screen', action: config.actions.handleFit },
    { id: 'reset', icon: icons.reset, tooltip: 'Reset Position', action: config.actions.handleReset },
    { id: 'expandAll', icon: icons.expandAll, tooltip: 'Expand All', action: config.actions.handleExpandAll },
    { id: 'collapseAll', icon: icons.collapseAll, tooltip: 'Collapse All', action: config.actions.handleCollapseAll },
    { id: 'columnAdjust', icon: icons.columnAdjust, tooltip: 'Adjust Child Columns', action: config.actions.handleColumnAdjustToggle },
    { id: 'swap', icon: icons.swap, tooltip: 'Swap Mode', action: config.actions.handleSwapToggle },
    { id: 'export', icon: icons.export, tooltip: 'Export SVG', action: config.actions.handleExport },
  ];

  if (config.experimental) {
    buttons.splice(6, 0, {
      id: 'toggleView',
      icon: config.currentView === 'hierarchy' ? icons.forceGraph : icons.orgChart,
      tooltip: config.currentView === 'hierarchy' ? 'Switch to Force Graph (Experimental)' : 'Switch to Org Chart',
      action: config.actions.handleToggleView,
    });
  }

  const tooltipPosition = getTooltipPosition(config.position, config.orientation);

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.setAttribute('data-id', `ychart-btn-${btn.id}-${config.instanceId}`);
    button.innerHTML = btn.icon;
    button.setAttribute('data-tooltip', btn.tooltip);
    button.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--yc-width-toolbar-button);
      height: var(--yc-height-toolbar-button);
      border: none;
      background: transparent;
      color: var(--yc-color-icon);
      cursor: pointer;
      border-radius: var(--yc-border-radius-lg);
      transition: all var(--yc-transition-fast);
      padding: 0;
    `;

    const tooltip = document.createElement('span');
    tooltip.className = 'ychart-tooltip';
    tooltip.textContent = btn.tooltip;

    tooltip.style.cssText = `
      position: absolute;
      ${tooltipPosition}
      background: var(--yc-color-overlay-dark);
      color: white;
      padding: var(--yc-spacing-sm) var(--yc-spacing-xl);
      border-radius: var(--yc-border-radius-md);
      font-size: var(--yc-font-size-sm);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.8);
      transition: all var(--yc-transition-fast) var(--yc-transition-bounce);
      z-index: var(--yc-z-index-search-popup);
      box-shadow: var(--yc-shadow-md);
    `;

    button.appendChild(tooltip);

    if (btn.id === 'toggleView' && config.experimental) {
      const badge = document.createElement('span');
      badge.textContent = '!';
      badge.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        background: var(--yc-color-warning-amber);
        color: white;
        border-radius: var(--yc-border-radius-full);
        width: var(--yc-height-badge);
        height: var(--yc-height-badge);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--yc-font-size-sm);
        font-weight: var(--yc-font-weight-bold);
        box-shadow: var(--yc-shadow-sm);
      `;
      button.appendChild(badge);
    }

    button.onmouseenter = () => {
      button.style.background = 'var(--yc-color-primary)';
      button.style.color = 'white';
      button.style.transform = 'var(--yc-transform-button-hover)';

      tooltip.style.opacity = '1';
      const isVertical = config.orientation === 'vertical';
      if (isVertical) {
        tooltip.style.transform = 'translateY(-50%) scale(1)';
      } else {
        tooltip.style.transform = 'translateX(-50%) scale(1)';
      }
    };

    button.onmouseleave = () => {
      if (btn.id === 'swap' && config.swapModeEnabled) {
        button.style.background = 'var(--yc-color-accent-red)';
        button.style.color = 'white';
      } else if (btn.id === 'columnAdjust' && config.columnAdjustMode) {
        button.style.background = 'var(--yc-color-accent-purple)';
        button.style.color = 'white';
      } else {
        button.style.background = 'transparent';
        button.style.color = 'var(--yc-color-icon)';
      }
      button.style.transform = 'var(--yc-transform-button-active)';

      tooltip.style.opacity = '0';
      const isVertical = config.orientation === 'vertical';
      if (isVertical) {
        tooltip.style.transform = 'translateY(-50%) scale(0.8)';
      } else {
        tooltip.style.transform = 'translateX(-50%) scale(0.8)';
      }
    };

    button.onclick = btn.action;
    toolbar.appendChild(button);
  });

  return toolbar;
}
