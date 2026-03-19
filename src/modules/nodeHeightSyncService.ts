/**
 * Node Height Synchronization Service
 * 
 * Ensures all nodes in the org chart have the same height by:
 * 1. Allowing content to flow naturally (fit-content via CSS)
 * 2. Measuring all node heights after initial render
 * 3. Finding the maximum height across all nodes
 * 4. Applying that height uniformly to all nodes
 * 
 * This creates a consistent, aligned appearance while respecting content needs.
 * If one node has more content and needs 200px, ALL nodes will be 200px.
 * 
 * Usage:
 * ```typescript
 * const service = new NodeHeightSyncService(svgElement, {
 *   minHeight: 110,
 *   maxHeight: 500,
 *   onHeightChange: (height) => console.log(`Synced to ${height}px`)
 * });
 * service.init();
 * 
 * // Later, after data changes:
 * service.triggerSync();
 * 
 * // Cleanup:
 * service.destroy();
 * ```
 */

export interface NodeHeightSyncConfig {
  /** Fixed height for nodes - if set, this height is used instead of measuring content */
  fixedHeight?: number;
  /** Minimum height for nodes (default: 80) - only used when fixedHeight is not set */
  minHeight?: number;
  /** Maximum height for nodes (default: none) */
  maxHeight?: number;
  /** Padding to add to calculated height (default: 0) */
  heightPadding?: number;
  /** Debounce delay for resize events in ms (default: 150) */
  resizeDebounce?: number;
  /** Callback when height changes */
  onHeightChange?: (newHeight: number) => void;
}

/** Internal config type with fixedHeight remaining optional */
type InternalNodeHeightSyncConfig = Omit<Required<NodeHeightSyncConfig>, 'fixedHeight'> & {
  fixedHeight: number | undefined;
};

export class NodeHeightSyncService {
  private container: HTMLElement | SVGElement;
  private config: InternalNodeHeightSyncConfig;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private resizeTimeout?: number;
  private currentUnifiedHeight: number = 0;
  private isSyncing: boolean = false;
  private lastSyncTime: number = 0;
  private pendingSync: boolean = false;

  constructor(
    container: HTMLElement | SVGElement,
    config: NodeHeightSyncConfig = {}
  ) {
    this.container = container;
    this.config = {
      fixedHeight: config.fixedHeight,
      minHeight: config.minHeight ?? 80,
      maxHeight: config.maxHeight ?? Infinity,
      heightPadding: config.heightPadding ?? 0,
      resizeDebounce: config.resizeDebounce ?? 150,
      onHeightChange: config.onHeightChange ?? (() => {}),
    };
  }

  /**
   * Initialize height synchronization
   * Sets up observers and performs initial sync
   */
  init(): void {
    this.syncNodeHeights();
    this.observeContentChanges();
  }

  /**
   * Measure and synchronize all node heights
   * @returns The unified height applied to all nodes
   */
  syncNodeHeights(): number {
    // Prevent re-entry during sync to avoid Firefox height expansion bug
    if (this.isSyncing) {
      this.pendingSync = true;
      return this.currentUnifiedHeight;
    }
    
    // Throttle syncs to prevent flickering - minimum 100ms between syncs
    const now = Date.now();
    if (now - this.lastSyncTime < 100) {
      this.pendingSync = true;
      return this.currentUnifiedHeight;
    }
    
    this.isSyncing = true;
    this.lastSyncTime = now;
    
    try {
      let targetHeight: number;

      // If fixedHeight is set, use it directly without measuring content
      if (this.config.fixedHeight !== undefined) {
        targetHeight = this.config.fixedHeight;
      } else {
        // Step 1: Reset heights to 'auto' to measure natural content height
        this.resetHeightsToAuto();

        // Step 2: Measure all node content heights
        targetHeight = this.measureMaxContentHeight();
      }

      // Only apply if height actually changed (prevents unnecessary DOM manipulation)
      if (targetHeight !== this.currentUnifiedHeight) {
        // Step 3: Apply unified height to all nodes
        this.applyUnifiedHeight(targetHeight);

        // Step 4: Store and notify
        this.currentUnifiedHeight = targetHeight;
        this.config.onHeightChange(targetHeight);
      }

      return targetHeight;
    } finally {
      // Use setTimeout to prevent immediate re-sync from ResizeObserver
      setTimeout(() => {
        this.isSyncing = false;
        
        // If a sync was requested while we were syncing, do it now
        if (this.pendingSync) {
          this.pendingSync = false;
          this.debouncedSync();
        }
      }, 100);
    }
  }

  /**
   * Reset all foreignObject and content div heights to 'auto' for measurement
   */
  private resetHeightsToAuto(): void {
    const foreignObjects = this.container.querySelectorAll<SVGForeignObjectElement>(
      'foreignObject.node-foreign-object'
    );

    foreignObjects.forEach((fo) => {
      // Set foreignObject height to auto
      fo.style.height = 'auto';
      fo.removeAttribute('height');

      // Set content divs to auto
      const contentDiv = fo.querySelector<HTMLDivElement>('.node-foreign-object-div');
      if (contentDiv) {
        contentDiv.style.height = 'auto';
        contentDiv.style.minHeight = 'auto';
      }

      const innerDiv = contentDiv?.querySelector<HTMLDivElement>('div');
      if (innerDiv) {
        innerDiv.style.height = 'auto';
        innerDiv.style.minHeight = 'auto';
      }
    });
  }

  /**
   * Measure the maximum content height across all nodes
   * @returns Maximum height found
   */
  private measureMaxContentHeight(): number {
    const foreignObjects = this.container.querySelectorAll<SVGForeignObjectElement>(
      'foreignObject.node-foreign-object'
    );

    let maxHeight = this.config.minHeight;

    foreignObjects.forEach((fo) => {
      // Get the content div
      const contentDiv = fo.querySelector<HTMLDivElement>('.node-foreign-object-div');
      if (!contentDiv) return;

      // Get the actual card content (first child with position:relative)
      // This avoids measuring floating elements like the siblings button
      const cardContent = contentDiv.querySelector<HTMLDivElement>('div[style*="position:relative"], div[style*="position: relative"]') || 
                          contentDiv.firstElementChild as HTMLDivElement;
      
      if (!cardContent) return;

      // Force a reflow to ensure accurate measurement
      cardContent.offsetHeight;

      // Use offsetHeight which doesn't include overflow content
      // This prevents the floating siblings button from affecting the measurement
      const contentHeight = cardContent.offsetHeight;

      // Update max height
      if (contentHeight > maxHeight) {
        maxHeight = contentHeight;
      }
    });

    // Apply padding and constraints
    maxHeight += this.config.heightPadding;
    maxHeight = Math.min(maxHeight, this.config.maxHeight);
    maxHeight = Math.max(maxHeight, this.config.minHeight);

    return Math.ceil(maxHeight);
  }

  /**
   * Apply the unified height to all nodes
   * Uses batch DOM updates to prevent flickering
   * @param height The height to apply
   */
  private applyUnifiedHeight(height: number): void {
    const foreignObjects = this.container.querySelectorAll<SVGForeignObjectElement>(
      'foreignObject.node-foreign-object'
    );

    // Batch all DOM reads first, then writes (prevents layout thrashing)
    const updates: Array<{
      fo: SVGForeignObjectElement;
      contentDiv: HTMLDivElement | null;
      innerDiv: HTMLDivElement | null;
    }> = [];
    
    foreignObjects.forEach((fo) => {
      const contentDiv = fo.querySelector<HTMLDivElement>('.node-foreign-object-div');
      const innerDiv = contentDiv?.querySelector<HTMLDivElement>('div') || null;
      updates.push({ fo, contentDiv, innerDiv });
    });
    
    // Now do all DOM writes in one batch using requestAnimationFrame
    // to align with the browser's paint cycle
    requestAnimationFrame(() => {
      updates.forEach(({ fo, contentDiv, innerDiv }) => {
        // Mark as synced for CSS targeting
        fo.setAttribute('data-height-synced', 'true');
        
        // Set foreignObject height
        fo.setAttribute('height', String(height));
        fo.style.height = `${height}px`;

        // Set content div heights
        if (contentDiv) {
          contentDiv.setAttribute('data-height-synced', 'true');
          contentDiv.style.height = `${height}px`;
          contentDiv.style.minHeight = `${height}px`;
        }

        if (innerDiv) {
          innerDiv.style.height = `${height}px`;
          innerDiv.style.minHeight = `${height}px`;
        }
      });

      // Also update any data-driven height attributes (for d3-org-chart)
      this.updateNodeDataHeights(height);
    });
  }

  /**
   * Update the data-driven height values for d3-org-chart nodes
   * @param height The height to set
   */
  private updateNodeDataHeights(height: number): void {
    const nodeGroups = this.container.querySelectorAll<SVGGElement>('.node');
    
    nodeGroups.forEach((nodeGroup) => {
      const node = nodeGroup as any;
      if (node.__data__) {
        node.__data__.height = height;
      }
    });
  }

  /**
   * Observe content changes and trigger re-sync
   * Uses passive observation to avoid interfering with rendering
   */
  private observeContentChanges(): void {
    // Use ResizeObserver to watch for content size changes
    // Only trigger sync if not currently in a sync cycle
    this.resizeObserver = new ResizeObserver((entries) => {
      // Skip if we're currently syncing (we caused this resize)
      if (this.isSyncing) return;
      
      // Skip if the resize is just setting our own height
      const hasRealChange = entries.some(entry => {
        const el = entry.target as HTMLElement;
        // If element has our sync marker and height matches, skip
        if (el.hasAttribute('data-height-synced') && 
            this.currentUnifiedHeight > 0 &&
            Math.abs(entry.contentRect.height - this.currentUnifiedHeight) < 2) {
          return false;
        }
        return true;
      });
      
      if (hasRealChange) {
        this.debouncedSync();
      }
    });

    // Observe all node content divs
    const contentDivs = this.container.querySelectorAll('.node-foreign-object-div');
    contentDivs.forEach((div) => {
      if (!div.hasAttribute('data-height-observed')) {
        div.setAttribute('data-height-observed', 'true');
        this.resizeObserver!.observe(div);
      }
    });

    // Also observe for new nodes being added
    this.mutationObserver = new MutationObserver((mutations) => {
      // Skip if triggered by our own updates
      if (this.isSyncing) return;
      
      // Check if new nodes were actually added (not just attribute changes)
      const hasNewNodes = mutations.some(m => 
        m.type === 'childList' && 
        (m.addedNodes.length > 0 || m.removedNodes.length > 0)
      );
      
      if (hasNewNodes) {
        // Re-observe new content divs
        const newDivs = this.container.querySelectorAll('.node-foreign-object-div');
        newDivs.forEach((div) => {
          if (!this.isObserved(div)) {
            div.setAttribute('data-height-observed', 'true');
            this.resizeObserver!.observe(div);
          }
        });
        this.debouncedSync();
      }
    });

    this.mutationObserver.observe(this.container, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if an element is already being observed
   */
  private isObserved(element: Element): boolean {
    // Simple heuristic: check if we're already observing this element
    // ResizeObserver doesn't provide a way to check directly
    return element.hasAttribute('data-height-observed');
  }

  /**
   * Debounced sync to avoid excessive recalculations
   * Uses a longer debounce for stability
   */
  private debouncedSync(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Use a slightly longer debounce to let D3 transitions complete
    this.resizeTimeout = window.setTimeout(() => {
      this.syncNodeHeights();
    }, Math.max(this.config.resizeDebounce, 200));
  }

  /**
   * Get the current unified height
   */
  getCurrentHeight(): number {
    return this.currentUnifiedHeight;
  }

  /**
   * Manually trigger a sync (useful after data changes)
   */
  triggerSync(): void {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.syncNodeHeights();
    });
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = undefined;
    }
  }
}

/**
 * Factory function for easy service creation
 */
export function createNodeHeightSync(
  container: HTMLElement | SVGElement,
  config?: NodeHeightSyncConfig
): NodeHeightSyncService {
  const service = new NodeHeightSyncService(container, config);
  service.init();
  return service;
}
