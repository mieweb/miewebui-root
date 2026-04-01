/**
 * Create an SVG dot pattern definition element.
 */
export function createDotPattern(patternColor?: string): SVGDefsElement {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("id", "dotPattern");
  pattern.setAttribute("width", "20");
  pattern.setAttribute("height", "20");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", "5");
  dot.setAttribute("cy", "5");
  dot.setAttribute("r", "0.75");
  dot.setAttribute("fill", patternColor || "var(--yc-color-pattern)");

  pattern.appendChild(dot);
  defs.appendChild(pattern);

  return defs;
}

/**
 * Create an SVG grid (dashed) pattern definition element.
 */
export function createGridPattern(patternColor?: string): SVGDefsElement {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("id", "gridPattern");
  pattern.setAttribute("width", "20");
  pattern.setAttribute("height", "20");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const color = patternColor || "var(--yc-color-pattern)";

  // Horizontal line
  const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  hLine.setAttribute("x1", "0");
  hLine.setAttribute("y1", "0");
  hLine.setAttribute("x2", "20");
  hLine.setAttribute("y2", "0");
  hLine.setAttribute("stroke", color);
  hLine.setAttribute("stroke-width", "0.5");
  hLine.setAttribute("stroke-dasharray", "3, 3");

  // Vertical line
  const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  vLine.setAttribute("x1", "0");
  vLine.setAttribute("y1", "0");
  vLine.setAttribute("x2", "0");
  vLine.setAttribute("y2", "20");
  vLine.setAttribute("stroke", color);
  vLine.setAttribute("stroke-width", "0.5");
  vLine.setAttribute("stroke-dasharray", "3, 3");

  pattern.appendChild(hLine);
  pattern.appendChild(vLine);
  defs.appendChild(pattern);

  return defs;
}

/**
 * Apply a background pattern (dotted or dashed) to the SVG in a chart container.
 */
export function applyBackgroundPattern(
  chartContainer: HTMLElement,
  bgPattern: 'dotted' | 'dashed',
  patternColor?: string,
): void {
  // Target the main chart SVG specifically, not nested SVGs (e.g. toolbar icons)
  const svg = chartContainer.querySelector('svg.svg-chart-container') || chartContainer.querySelector(':scope > svg');
  if (!svg) {
    console.warn('SVG not found in chart container');
    return;
  }

  // Get or create defs element
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  // Remove existing pattern definitions
  const existingPattern = defs.querySelector('#dotPattern, #gridPattern');
  if (existingPattern) {
    existingPattern.remove();
  }

  // Create and add pattern
  const patternDefs = bgPattern === 'dotted'
    ? createDotPattern(patternColor)
    : createGridPattern(patternColor);
  
  const patternElement = patternDefs.firstChild;
  if (patternElement) {
    defs.appendChild(patternElement);
  }

  // Remove existing background rect if any
  const existingRect = svg.querySelector('#pattern-background');
  if (existingRect) {
    existingRect.remove();
  }

  // Create background rect and insert it as the first child after defs
  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("id", "pattern-background");
  bgRect.setAttribute("x", "-50000");
  bgRect.setAttribute("y", "-50000");
  bgRect.setAttribute("width", "100000");
  bgRect.setAttribute("height", "100000");

  const patternId = bgPattern === 'dotted' ? 'dotPattern' : 'gridPattern';
  bgRect.setAttribute("fill", `url(#${patternId})`);
  
  // Insert as first visible element (right after defs, before everything else)
  const firstNonDefsChild = Array.from(svg.children).find(child => child.tagName !== 'defs');
  if (firstNonDefsChild) {
    svg.insertBefore(bgRect, firstNonDefsChild);
  } else {
    svg.appendChild(bgRect);
  }
}

/**
 * Set up a MutationObserver to reapply patterns when the SVG is re-rendered.
 * Returns the observer for cleanup.
 */
export function setupPatternPersistence(
  chartContainer: HTMLElement,
  getBgPattern: () => 'dotted' | 'dashed' | undefined,
  patternColor?: string,
): MutationObserver {
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    const bgPattern = getBgPattern();
    if (bgPattern) {
      const svg = chartContainer.querySelector('svg.svg-chart-container') || chartContainer.querySelector(':scope > svg');
      const bgRect = svg?.querySelector('#pattern-background');
      const patternDef = svg?.querySelector('#dotPattern, #gridPattern');
      if (svg && (!bgRect || !patternDef)) {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          const currentPattern = getBgPattern();
          if (currentPattern) {
            applyBackgroundPattern(chartContainer, currentPattern, patternColor);
          }
        }, 50);
      }
    }
  });

  observer.observe(chartContainer, {
    childList: true,
    subtree: true
  });

  return observer;
}
