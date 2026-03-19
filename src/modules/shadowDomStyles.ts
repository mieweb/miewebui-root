/**
 * Get the complete CSS styles for Shadow DOM injection.
 * This is a comprehensive stylesheet that includes all YChart styles,
 * design system variables, and component styles.
 */
export function getShadowDOMStyles(): string {
  return `
      /* =============================================================================
       * YChart Design System Variables
       * ============================================================================= */
      :host {
        /* COLOR PALETTE */
        --yc-color-primary: var(--color-primary, #667eea);
        --yc-color-primary-dark: var(--color-primary-dark, #5568d3);
        --yc-color-primary-light: var(--color-primary-light, #764ba2);
        --yc-color-secondary: #4A90E2;
        --yc-color-secondary-hover: #5a7fc4;
        
        /* Neutral Grays */
        --yc-color-gray-50: #fafbfc;
        --yc-color-gray-100: #f7fafc;
        --yc-color-gray-200: #f5f7fa;
        --yc-color-gray-300: #f1f1f1;
        --yc-color-gray-400: #e0e0e0;
        --yc-color-gray-500: #ccc;
        --yc-color-gray-600: #999;
        --yc-color-gray-700: #666;
        --yc-color-gray-800: #333;
        --yc-color-gray-900: #1a202c;
        
        /* Text Colors */
        --yc-color-text-primary: var(--yc-color-gray-800);
        --yc-color-text-secondary: var(--yc-color-gray-700);
        --yc-color-text-tertiary: var(--yc-color-gray-600);
        --yc-color-text-muted: #718096;
        --yc-color-text-light: #a0aec0;
        --yc-color-text-heading: #2d3748;
        --yc-color-text-inverse: #ffffff;
        
        /* Background Colors */
        --yc-color-bg-primary: #ffffff;
        --yc-color-bg-secondary: var(--yc-color-gray-200);
        --yc-color-bg-tertiary: var(--yc-color-gray-50);
        --yc-color-bg-card: #ffffff;
        
        /* Editor Colors */
        --yc-color-editor-bg: #282c34;
        --yc-color-editor-border: #3e4451;
        --yc-color-editor-text: #abb2bf;
        
        /* State Colors */
        --yc-color-error: #c33;
        --yc-color-error-light: #fee;
        --yc-color-error-bg: #fee2e2;
        --yc-color-error-bg-gradient: #fecaca;
        --yc-color-error-border: #ef4444;
        --yc-color-error-red: #ff4444;
        --yc-color-error-red-bg: rgba(255, 68, 68, 0.1);
        --yc-color-error-red-light: #dc2626;
        --yc-color-error-red-dark: #b91c1c;
        --yc-color-error-red-text: #7f1d1d;
        --yc-color-error-red-accent: #c53030;
        --yc-color-error-red-hover: #feb2b2;
        --yc-color-error-red-border: #fc8181;
        
        --yc-color-warning: #ffaa00;
        --yc-color-warning-bg: rgba(255, 170, 0, 0.1);
        --yc-color-warning-amber: #f59e0b;
        --yc-color-warning-amber-dark: #d97706;
        --yc-color-warning-amber-darker: #b45309;
        
        --yc-color-success: #2196F3;
        --yc-color-success-shadow: rgba(33, 150, 243, 0.6);
        
        /* Interactive Colors */
        --yc-color-button-text: var(--yc-color-primary);
        --yc-color-button-bg: var(--yc-color-gray-100);
        --yc-color-button-bg-hover: #edf2f7;
        --yc-color-button-border: #e2e8f0;
        --yc-color-button-border-hover: #cbd5e0;
        --yc-color-icon: #4a5568;
        
        /* Overlay & Shadow Colors */
        --yc-color-overlay-bg: rgba(255, 255, 255, 0.95);
        --yc-color-overlay-dark: rgba(0, 0, 0, 0.9);
        --yc-color-overlay-white-15: rgba(255, 255, 255, 0.15);
        --yc-color-overlay-white-90: rgba(255, 255, 255, 0.9);
        --yc-color-shadow-light: rgba(0, 0, 0, 0.1);
        --yc-color-shadow-medium: rgba(0, 0, 0, 0.15);
        --yc-color-shadow-dark: rgba(0, 0, 0, 0.2);
        --yc-color-shadow-3xl: rgba(0, 0, 0, 0.3);
        
        /* Pattern Colors */
        --yc-color-pattern: #cacaca;
        
        /* TYPOGRAPHY */
        --yc-font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        --yc-font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        
        /* Font Sizes */
        --yc-font-size-xxs: 0.625rem;
        --yc-font-size-xs: 0.6875rem;
        --yc-font-size-sm: 0.75rem;
        --yc-font-size-base: 0.8125rem;
        --yc-font-size-md: 0.875rem;
        --yc-font-size-lg: 0.9375rem;
        --yc-font-size-xl: 1rem;
        --yc-font-size-2xl: 1.125rem;
        --yc-font-size-3xl: 1.3rem;
        --yc-font-size-4xl: 1.8rem;
        
        /* Font Weights */
        --yc-font-weight-normal: 400;
        --yc-font-weight-medium: 500;
        --yc-font-weight-semibold: 600;
        --yc-font-weight-bold: 700;
        
        /* SPACING */
        --yc-spacing-xxs: 0.125rem;
        --yc-spacing-xs: 0.25rem;
        --yc-spacing-sm: 0.375rem;
        --yc-spacing-md: 0.5rem;
        --yc-spacing-lg: 0.625rem;
        --yc-spacing-xl: 0.75rem;
        --yc-spacing-2xl: 0.875rem;
        --yc-spacing-3xl: 1rem;
        --yc-spacing-4xl: 1.25rem;
        --yc-spacing-5xl: 1.5rem;
        --yc-spacing-6xl: 2rem;
        
        /* BORDERS */
        --yc-border-width-thin: 1px;
        --yc-border-width-medium: 2px;
        --yc-border-width-thick: 3px;
        --yc-border-width-heavy: 4px;
        
        --yc-border-radius-sm: 0.25rem;
        --yc-border-radius-md: 0.375rem;
        --yc-border-radius-lg: 0.5rem;
        --yc-border-radius-xl: 0.75rem;
        --yc-border-radius-full: 50%;
        --yc-border-radius-pill: 1.25rem;
        
        /* SHADOWS */
        --yc-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
        --yc-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
        --yc-shadow-md: 0 2px 5px rgba(0, 0, 0, 0.1);
        --yc-shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1);
        --yc-shadow-xl: 0 4px 10px rgba(0, 0, 0, 0.15);
        --yc-shadow-2xl: 0 4px 12px rgba(0, 0, 0, 0.15);
        --yc-shadow-3xl: 0 4px 15px rgba(0, 0, 0, 0.1);
        --yc-shadow-4xl: 0 8px 24px rgba(0, 0, 0, 0.2);
        --yc-shadow-button: 0 2px 8px rgba(102, 126, 234, 0.3);
        --yc-shadow-node-selected: 0 0 8px rgba(33, 150, 243, 0.6);
        
        /* SIZING */
        --yc-width-sidebar: 400px;
        --yc-width-sidebar-collapsed: 0px;
        --yc-width-detail-panel: 400px;
        --yc-width-detail-panel-max: 350px;
        --yc-width-search-popup: 500px;
        --yc-width-toolbar-button: 36px;
        --yc-height-toolbar-button: 36px;
        --yc-height-badge: 16px;
        --yc-height-icon-sm: 20px;
        --yc-height-icon-md: 24px;
        --yc-height-button-sm: 24px;
        --yc-height-button-md: 28px;
        --yc-height-error-banner-max: 120px;
        
        /* Z-INDEX */
        --yc-z-index-base: 1;
        --yc-z-index-overlay-button: 5;
        --yc-z-index-overlay: 10;
        --yc-z-index-toolbar: 50;
        --yc-z-index-detail-panel: 100;
        --yc-z-index-search-popup: 1000;
        --yc-z-index-search-history: 999;
        --yc-z-index-collapse-button: 1001;
        
        /* TRANSITIONS */
        --yc-transition-fast: 0.2s ease;
        --yc-transition-normal: 0.3s ease;
        --yc-transition-slow: 0.4s ease;
        --yc-transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        
        /* OPACITY */
        --yc-opacity-disabled: 0.5;
        --yc-opacity-hover: 0.8;
        --yc-opacity-dragging: 0.7;
        --yc-opacity-node-hover: 0.9;
        
        /* GRADIENTS */
        --yc-gradient-primary: linear-gradient(135deg, var(--yc-color-primary) 0%, var(--yc-color-primary-light) 100%);
        --yc-gradient-error: linear-gradient(135deg, var(--yc-color-error-bg) 0%, var(--yc-color-error-bg-gradient) 100%);
        --yc-gradient-background: linear-gradient(to bottom, var(--yc-color-gray-50) 0%, var(--yc-color-gray-200) 100%);
      }

      /* =============================================================================
       * YChart Library Styles (Scoped to .ychart-container)
       * ============================================================================= */
      .ychart-container {
        font-family: var(--yc-font-family-base);
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        overflow: hidden;
      }

      .ychart-container *,
      .ychart-container *::before,
      .ychart-container *::after {
        box-sizing: border-box;
      }

      .ychart-chart-wrapper {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        position: relative;
        height: 100%;
      }

      .ychart-editor-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        background: var(--yc-color-bg-primary);
        overflow: hidden;
        border-left: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
      }

      .ychart-chart {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        position: relative;
        background: var(--yc-gradient-background);
      }

      .ychart-chart svg {
        display: block;
        cursor: grab;
      }

      .ychart-chart svg:active {
        cursor: grabbing;
      }

      .ychart-chart svg circle {
        cursor: pointer;
        transition: all var(--yc-transition-fast);
      }

      .ychart-chart svg circle:hover {
        fill: var(--yc-color-secondary-hover);
        stroke-width: var(--yc-border-width-heavy);
      }

      .ychart-chart svg text {
        user-select: none;
        -webkit-user-select: none;
      }

      .ychart-chart svg g {
        cursor: move;
      }

      .ychart-chart .html-overlay-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: var(--yc-z-index-overlay);
      }

      .ychart-chart .html-overlay-container .overlay-node {
        pointer-events: auto;
        background: transparent;
        border-radius: var(--yc-border-radius-lg);
      }

      .ychart-chart .html-overlay-container .overlay-content {
        user-select: text;
        -webkit-user-select: text;
        cursor: text;
      }

      .ychart-chart .html-overlay-container .overlay-content .details-btn,
      .ychart-chart .html-overlay-container .overlay-content button,
      .ychart-chart .html-overlay-container .overlay-content a {
        cursor: pointer;
      }

      .node-foreign-object {
        overflow: visible;
        transition: height 0.15s ease-out;
      }

      .node-foreign-object-div {
        position: relative;
        user-select: text;
        -webkit-user-select: text;
        cursor: text;
        transition: height 0.15s ease-out, min-height 0.15s ease-out;
      }

      .node-foreign-object-div .details-btn,
      .node-foreign-object-div button,
      .node-foreign-object-div a {
        cursor: pointer;
      }

      .node-group {
        cursor: move;
        transition: opacity var(--yc-transition-fast);
      }

      .node-group.dragging {
        opacity: var(--yc-opacity-dragging);
        cursor: grabbing !important;
      }

      .node-group:hover {
        opacity: var(--yc-opacity-node-hover);
      }

      .node.selected .node-rect {
        stroke: var(--yc-color-success) !important;
        stroke-width: var(--yc-border-width-heavy) !important;
        filter: drop-shadow(var(--yc-shadow-node-selected));
      }

      .ychart-toolbar {
        display: flex;
        gap: var(--yc-spacing-sm);
        background: var(--yc-color-bg-primary);
        border: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
        border-radius: var(--yc-border-radius-md);
        padding: var(--yc-spacing-sm);
        box-shadow: var(--yc-shadow-md);
        z-index: var(--yc-z-index-toolbar);
      }

      .ychart-search-bar {
        display: flex;
        align-items: center;
        gap: var(--yc-spacing-sm);
        background: var(--yc-color-bg-primary);
        border: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
        border-radius: var(--yc-border-radius-md);
        padding: var(--yc-spacing-sm) var(--yc-spacing-md);
      }

      .ychart-search-input {
        border: none;
        outline: none;
        font-size: var(--yc-font-size-base);
        background: transparent;
        color: var(--yc-color-text-primary);
      }

      .ychart-search-input::placeholder {
        color: var(--yc-color-text-muted);
      }

      .ychart-search-results {
        position: absolute;
        background: var(--yc-color-bg-primary);
        border: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
        border-radius: var(--yc-border-radius-md);
        box-shadow: var(--yc-shadow-lg);
        max-height: 300px;
        overflow-y: auto;
        z-index: var(--yc-z-index-search-popup);
      }

      .ychart-error-banner {
        background: var(--yc-color-error-bg);
        border: var(--yc-border-width-thin) solid var(--yc-color-error-border);
        border-radius: var(--yc-border-radius-md);
        padding: var(--yc-spacing-sm) var(--yc-spacing-md);
        color: var(--yc-color-error-red-text);
        font-size: var(--yc-font-size-sm);
      }

      .ychart-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--yc-spacing-md) var(--yc-spacing-lg);
        background: var(--yc-color-bg-tertiary);
        border-bottom: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
      }

      .ychart-toggle-editor {
        position: absolute;
        background: var(--yc-color-bg-primary);
        border: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
        border-radius: var(--yc-border-radius-sm);
        padding: var(--yc-spacing-sm);
        cursor: pointer;
        z-index: var(--yc-z-index-toolbar);
      }

      .ychart-toggle-editor:hover {
        background: var(--yc-color-gray-200);
      }

      .ychart-editor {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .ychart-editor .cm-editor {
        flex: 1;
        min-height: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        font-size: var(--yc-font-size-md);
      }

      .ychart-editor .cm-scroller {
        flex: 1;
        min-height: 0;
        overflow: auto !important;
      }

      .ychart-editor .cm-lintRange-error {
        background-color: var(--yc-color-error-red-bg);
        border-bottom: var(--yc-border-width-medium) wavy var(--yc-color-error-red);
      }

      .ychart-editor .cm-lintRange-warning {
        background-color: var(--yc-color-warning-bg);
        border-bottom: var(--yc-border-width-medium) wavy var(--yc-color-warning);
      }

      /* Node details panel */
      .ychart-node-details {
        position: absolute;
        top: var(--yc-spacing-3xl);
        right: var(--yc-spacing-3xl);
        background: var(--yc-color-bg-primary);
        border: var(--yc-border-width-thin) solid var(--yc-color-gray-400);
        border-radius: var(--yc-border-radius-lg);
        box-shadow: var(--yc-shadow-3xl);
        max-width: var(--yc-width-detail-panel-max);
        z-index: var(--yc-z-index-detail-panel);
        max-height: calc(100vh - 12rem);
        overflow-y: auto;
      }

      .ychart-node-details .node-details-content {
        padding: var(--yc-spacing-5xl);
      }

      .ychart-node-details h3 {
        color: var(--yc-color-text-primary);
        font-size: var(--yc-font-size-3xl);
        margin-bottom: var(--yc-spacing-3xl);
        padding-bottom: var(--yc-spacing-xl);
        border-bottom: var(--yc-border-width-medium) solid var(--yc-color-primary);
      }

      .ychart-node-details .details-grid {
        display: flex;
        flex-direction: column;
        gap: var(--yc-spacing-xl);
        margin-bottom: var(--yc-spacing-5xl);
      }

      .ychart-node-details .detail-row {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: var(--yc-spacing-md);
        align-items: start;
      }

      .ychart-node-details .detail-label {
        color: var(--yc-color-text-secondary);
        font-size: var(--yc-font-size-md);
        font-weight: var(--yc-font-weight-semibold);
        text-transform: capitalize;
      }

      .ychart-node-details .detail-value {
        color: var(--yc-color-text-primary);
        font-size: var(--yc-font-size-lg);
        word-break: break-word;
      }

      .ychart-node-details .btn-close {
        width: 100%;
        background: var(--yc-color-primary);
        color: var(--yc-color-text-inverse);
        border: none;
        padding: var(--yc-spacing-xl);
        border-radius: var(--yc-border-radius-md);
        font-size: var(--yc-font-size-lg);
        font-weight: var(--yc-font-weight-semibold);
        cursor: pointer;
        transition: all var(--yc-transition-normal);
      }

      .ychart-node-details .btn-close:hover {
        background: var(--yc-color-primary-dark);
        transform: translateY(-1px);
        box-shadow: var(--yc-shadow-button);
      }

      /* Tooltip styles */
      .expand-siblings-btn .node-tooltip,
      .expand-supervisor-chain-btn .node-tooltip,
      .ychart-expand-btn-wrapper .node-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) scale(0.8);
        background: var(--yc-color-overlay-dark);
        color: white;
        padding: var(--yc-spacing-sm) var(--yc-spacing-xl);
        border-radius: var(--yc-border-radius-md);
        font-size: var(--yc-font-size-sm);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: all var(--yc-transition-fast) var(--yc-transition-bounce);
        z-index: var(--yc-z-index-search-popup);
        box-shadow: var(--yc-shadow-md);
        margin-bottom: var(--yc-spacing-sm);
      }

      .expand-siblings-btn:hover .node-tooltip,
      .expand-supervisor-chain-btn:hover .node-tooltip,
      .ychart-expand-btn-wrapper:hover .node-tooltip {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }

      /* Animations */
      @keyframes ychart-fadeInOut {
        0%, 100% { opacity: 0; }
        10%, 90% { opacity: 1; }
      }

      @keyframes ychart-pulseGlow {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
          transform: scale(1.05);
        }
      }
    `;
}
