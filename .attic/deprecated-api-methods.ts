/**
 * ARCHIVED: Deprecated API methods from YChartEditor.
 * 
 * These methods were removed because the toolbar is now built-in. 
 * They previously allowed attaching external buttons to control the chart.
 * 
 * Archived on: 2026-03-18
 * Reason: Toolbar is built into the canvas; external button bindings are no longer needed.
 * Last used in: YChartEditor class (ychartEditor.ts)
 */

// enableSwapBtn(btnIdOrElement: string | HTMLElement): this
// resetBtn(btnIdOrElement: string | HTMLElement): this
// exportSVGBtn(btnIdOrElement: string | HTMLElement): this
// toggleViewBtn(btnIdOrElement: string | HTMLElement): this

/*
  enableSwapBtn(btnIdOrElement: string | HTMLElement): this {
    console.warn('enableSwapBtn is deprecated. Buttons are now built into the canvas.');
    const btn = typeof btnIdOrElement === 'string'
      ? document.getElementById(btnIdOrElement)
      : btnIdOrElement;

    if (!btn) {
      console.warn(`Swap button not found: ${btnIdOrElement}`);
      return this;
    }

    btn.addEventListener('click', () => this.handleSwapToggle());
    return this;
  }

  resetBtn(btnIdOrElement: string | HTMLElement): this {
    console.warn('resetBtn is deprecated. Buttons are now built into the canvas.');
    const btn = typeof btnIdOrElement === 'string'
      ? document.getElementById(btnIdOrElement)
      : btnIdOrElement;

    if (!btn) {
      console.warn(`Reset button not found: ${btnIdOrElement}`);
      return this;
    }

    btn.addEventListener('click', () => this.handleReset());
    return this;
  }

  exportSVGBtn(btnIdOrElement: string | HTMLElement): this {
    console.warn('exportSVGBtn is deprecated. Buttons are now built into the canvas.');
    const btn = typeof btnIdOrElement === 'string'
      ? document.getElementById(btnIdOrElement)
      : btnIdOrElement;

    if (!btn) {
      console.warn(`Export button not found: ${btnIdOrElement}`);
      return this;
    }

    btn.addEventListener('click', () => this.handleExport());
    return this;
  }

  toggleViewBtn(btnIdOrElement: string | HTMLElement): this {
    console.warn('toggleViewBtn is deprecated. Buttons are now built into the canvas.');
    const btn = typeof btnIdOrElement === 'string'
      ? document.getElementById(btnIdOrElement)
      : btnIdOrElement;

    if (!btn) {
      console.warn(`Toggle view button not found: ${btnIdOrElement}`);
      return this;
    }

    btn.addEventListener('click', () => this.handleToggleView());
    return this;
  }
*/
