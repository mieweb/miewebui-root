import { EditorView } from 'codemirror';
import * as jsyaml from 'js-yaml';
import { OrgChart } from './d3-org-chart.js';
import './styles/ychart-lib-entry.scss';

import {
  // Types & constants
  YCHART_VERSION,
  generateUUID,
  // Data
  parseFrontMatter as parseFrontMatterFn,
  resolveMissingParentIds as resolveMissingParentIdsFn,
  // Visualization
  ForceGraph,
  applyBackgroundPattern,
  setupPatternPersistence,
  // UI
  createToolbar as createToolbarFn,
  SearchManager,
  ColumnAdjustManager,
  getShadowDOMStyles,
  unmountAllReactRoots,
  // Editor
  createEditor,
  updateErrorBanner,
  jumpToEditorLine,
  formatYAML,
  scrollToNodeInEditor,
  // Node rendering
  buildExpandSiblingsBtn,
  buildExpandSupervisorChainBtn,
  renderNodeContent,
  renderNodeDetails,
  // Layout
  buildLayout,
  // POI
  POIManager,
  // Services
  NodeHeightSyncService,
} from './modules';
import type { YChartOptions, SchemaDefinition, CardElement, FrontMatter } from './modules';


class YChartEditor {
  private viewContainer: HTMLElement | null = null;
  private editorContainer: HTMLElement | null = null;
  private chartContainer: HTMLElement | null = null;
  private editor: EditorView | null = null;
  private orgChart: any = null;
  private forceGraph: ForceGraph | null = null;
  private currentView: 'hierarchy' | 'force' = 'hierarchy';
  private swapModeEnabled = false;
  private isUpdatingProgrammatically = false;
  private defaultOptions: YChartOptions;
  private initialData: string = '';
  private detailsPanel: HTMLElement | null = null;
  private bgPattern: 'dotted' | 'dashed' | undefined = undefined;
  private toolbar: HTMLElement | null = null;
  private toolbarPosition: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'topcenter' | 'bottomcenter' = 'bottomleft';
  private toolbarOrientation: 'horizontal' | 'vertical' = 'horizontal';
  private customTemplate: ((d: any, schema: SchemaDefinition) => string) | null = null;
  private currentSchema: SchemaDefinition = {};
  private cardTemplate: CardElement[] | null = null;
  private columnAdjustManager!: ColumnAdjustManager;
  private experimental = false;
  private instanceId: string;
  private errorBanner: HTMLElement | null = null;
  private searchManager!: SearchManager;
  private poiManager!: POIManager;

  // Default supervisor field aliases - can be overridden via schema or supervisorLookup()
  private supervisorFields: string[] = ['supervisor', 'reports', 'reports_to', 'manager', 'leader', 'parent'];
  private nameField: string = 'name';
  private nodeHeightSync: NodeHeightSyncService | null = null;
  // Current merged options (defaultOptions + YAML options)
  private currentOptions: YChartOptions = {};
  // Truth data (complete YAML data)
  private truthData: any[] = [];
  // Shadow DOM support
  private shadowRoot: ShadowRoot | null = null;
  private useShadowDOM: boolean = false;
  
  constructor(options?: YChartOptions) {
    this.instanceId = generateUUID();
    this.defaultOptions = {
      nodeWidth: 220,
      nodeHeight: 110,
      childrenMargin: 50,
      compactMarginBetween: 35,
      compactMarginPair: 30,
      neighbourMargin: 20,
      editorTheme: 'dark',
      collapsible: true,
      toolbarPosition: 'bottomleft',
      toolbarOrientation: 'horizontal',
      ...options
    };

    // Set toolbar position and orientation from options
    this.toolbarPosition = this.defaultOptions.toolbarPosition!;
    this.toolbarOrientation = this.defaultOptions.toolbarOrientation!;
    this.experimental = this.defaultOptions.experimental || false;
    this.useShadowDOM = this.defaultOptions.useShadowDOM || false;
  }

  /**
   * Initialize the view with a container element
   */
  initView(containerIdOrElement: string | HTMLElement, yamlData: string): this {
    // Get the main container
    const hostContainer = typeof containerIdOrElement === 'string'
      ? document.getElementById(containerIdOrElement)
      : containerIdOrElement;

    if (!hostContainer) {
      throw new Error(`Container not found: ${containerIdOrElement}`);
    }

    this.initialData = yamlData;

    // Set up Shadow DOM if enabled
    if (this.useShadowDOM) {
      this.shadowRoot = hostContainer.attachShadow({ mode: 'open' });
      
      // Inject styles into Shadow DOM
      this.injectShadowDOMStyles();
      
      // Create a container inside the shadow root
      const shadowContainer = document.createElement('div');
      shadowContainer.style.cssText = 'width:100%;height:100%;';
      this.shadowRoot.appendChild(shadowContainer);
      this.viewContainer = shadowContainer;
    } else {
      this.viewContainer = hostContainer;
    }

    // Create the layout structure
    this.createLayout();
    
    // Initialize the editor
    this.initializeEditor();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Set up expand siblings handlers for POI feature
    this.poiManager.setupExpandSiblingsHandlers();
    
    // Render initial chart
    this.renderChart();

    // Auto-collapse editor after 1 second to ensure proper initialization
    this.toggleEditor();
    // setTimeout(() => {
    // }, 10);

    // eslint-disable-next-line no-console -- Intentional: Display version on successful init
    console.log(`%cYChart Editor v${YCHART_VERSION}%c initialized successfully${this.useShadowDOM ? ' (Shadow DOM)' : ''}`, 'color: #667eea; font-weight: bold;', 'color: inherit;');

    return this;
  
}

  /**
   * Load new YAML data into the editor and re-render the chart
   */
  loadYaml(yamlData: string): this {
    if (!this.editor) {
      throw new Error('Editor not initialized. Call initView first.');
    }

    // Update editor content
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: yamlData
      }
    });

    // Re-render the chart
    this.renderChart();

    return this;
  }

  private createLayout(): void {
    if (!this.viewContainer) return;

    const layout = buildLayout(this.viewContainer, {
      instanceId: this.instanceId,
      collapsible: this.defaultOptions.collapsible ?? true,
      onToggleEditor: () => this.toggleEditor(),
      onFormatYAML: () => this.handleFormatYAML(),
    });

    this.chartContainer = layout.chartContainer;
    this.detailsPanel = layout.detailsPanel;
    this.editorContainer = layout.editorContainer;
    this.errorBanner = layout.errorBanner;

    // Create toolbar
    this.columnAdjustManager = new ColumnAdjustManager({
      instanceId: this.instanceId,
      getChartContainer: () => this.chartContainer,
      getOrgChart: () => this.orgChart,
    });
    this.toolbar = this.createToolbar();
    layout.chartWrapper.appendChild(this.toolbar);

    // Create search manager
    this.searchManager = new SearchManager({
      instanceId: this.instanceId,
      getOrgChart: () => this.orgChart,
      getTruthData: () => this.truthData,
      getCurrentSchema: () => this.currentSchema,
      getChartContainer: () => this.chartContainer,
      getPersonOfInterest: () => this.poiManager.personOfInterest,
      setPersonOfInterest: (id: string) => this.poiManager.setPersonOfInterest(id),
      updatePOISelectorValue: (id: string) => this.poiManager.updatePOISelectorValue(id),
    });
    const floatingSearchBar = this.searchManager.createFloatingSearchBar();
    layout.chartWrapper.appendChild(floatingSearchBar);
    this.searchManager.createSearchPopup();

    // Create POI manager & selector
    this.poiManager = new POIManager({
      instanceId: this.instanceId,
      getOrgChart: () => this.orgChart,
      getTruthData: () => this.truthData,
      getSupervisorFields: () => this.supervisorFields,
      getNameField: () => this.nameField,
      getChartContainer: () => this.chartContainer,
      renderChart: () => this.renderChart(),
    });
    layout.chartWrapper.appendChild(this.poiManager.createPOISelector());
  }

        private createToolbar(): HTMLElement {
    return createToolbarFn({
      instanceId: this.instanceId,
      position: this.toolbarPosition,
      orientation: this.toolbarOrientation,
      experimental: this.experimental,
      currentView: this.currentView,
      swapModeEnabled: this.swapModeEnabled,
      columnAdjustMode: this.columnAdjustManager?.isActive ?? false,
      actions: {
        handleFit: () => this.handleFit(),
        handleReset: () => this.handleReset(),
        handleExpandAll: () => this.handleExpandAll(),
        handleCollapseAll: () => this.handleCollapseAll(),
        handleColumnAdjustToggle: () => this.columnAdjustManager.toggle(),
        handleSwapToggle: () => this.handleSwapToggle(),
        handleExport: () => this.handleExport(),
        handleToggleView: () => this.handleToggleView(),
      },
    });
  }

  private handleFit(): void {
    if (this.orgChart) {
      this.orgChart.fit();
    }
  }

  private handleReset(): void {
    this.renderChart();
  }

  private handleSwapToggle(): void {
    if (!this.orgChart) return;

    this.swapModeEnabled = !this.swapModeEnabled;

    if (typeof this.orgChart.enableSwapMode === 'function') {
      this.orgChart.enableSwapMode(this.swapModeEnabled);
    }

    if (typeof this.orgChart.onNodeSwap === 'function') {
      this.orgChart.onNodeSwap((data1: any, data2: any) => {
        this.updateYAMLAfterSwap(data1, data2);
      });
    }

    // Update button style
    const swapBtn = document.querySelector(`[data-id="ychart-btn-swap-${this.instanceId}"]`) as HTMLElement;
    if (swapBtn) {
      if (this.swapModeEnabled) {
        swapBtn.style.background = 'var(--yc-color-accent-red)';
        swapBtn.style.color = 'white';
      } else {
        swapBtn.style.background = 'transparent';
        swapBtn.style.color = 'var(--yc-color-icon)';
      }
    }
  }

  private handleToggleView(): void {
    if (this.currentView === 'hierarchy') {
      this.renderForceGraph();
    } else {
      this.renderChart();
    }

    // Update the toggle view button icon and tooltip
    const toggleBtn = document.querySelector(`[data-id="ychart-btn-toggleView-${this.instanceId}"]`) as HTMLElement;
    if (toggleBtn) {
      const icons = {
        forceGraph: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><line x1="12" y1="7" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="14" y1="12" x2="17" y2="12"/><line x1="7" y1="12" x2="10" y2="12"/></svg>`,
        orgChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
      };

      if (this.currentView === 'hierarchy') {
        toggleBtn.innerHTML = icons.forceGraph;
        toggleBtn.title = 'Switch to Force Graph';
      } else {
        toggleBtn.innerHTML = icons.orgChart;
        toggleBtn.title = 'Switch to Org Chart';
      }
    }
  }

  private handleExport(): void {
    if (this.orgChart && typeof this.orgChart.exportSvg === 'function') {
      this.orgChart.exportSvg();
    }
  }

  private handleFormatYAML(): void {
    if (!this.editor) return;
    formatYAML(this.editor);
  }

  private handleExpandAll(): void {
    if (this.orgChart && typeof this.orgChart.expandAll === 'function') {
      this.orgChart.expandAll();
      this.orgChart.render();
      setTimeout(() => {
        if (this.orgChart) {
          this.orgChart.fit();
        }
      }, 200);
    }
  }

  private handleCollapseAll(): void {
    if (this.orgChart && typeof this.orgChart.collapseAll === 'function') {
      this.orgChart.collapseAll();
      this.orgChart.render();
      setTimeout(() => {
        if (this.orgChart) {
          this.orgChart.fit();
        }
      }, 200);
    }
  }

  private initializeEditor(): void {
    if (!this.editorContainer) return;

    this.editor = createEditor(
      this.editorContainer,
      this.initialData,
      this.defaultOptions.editorTheme,
      (content: string) => this.parseFrontMatter(content),
      (diagnostics, view) => {
        if (this.errorBanner) {
          updateErrorBanner(this.errorBanner, diagnostics, view, (line) => this.jumpToLine(line));
        }
      },
      () => {
        if (!this.isUpdatingProgrammatically) {
          this.renderChart();
        }
      },
    );
  }

  private toggleEditor(): void {
    const sidebar = document.getElementById(`ychart-editor-sidebar-${this.instanceId}`);
    const collapseBtn = document.querySelector(`[data-id="ychart-collapse-editor-${this.instanceId}"]`) as HTMLElement;
    
    if (!sidebar || !collapseBtn) return;

    const isCollapsed = sidebar.style.width === '0px';
    
    if (isCollapsed) {
      // Expand
      sidebar.style.width = '400px';
      sidebar.style.borderLeftWidth = '1px';
      sidebar.style.transition = 'width 0.3s ease, border-left-width 0s 0s';
      collapseBtn.style.right = '399px';
      collapseBtn.innerHTML = '▶';
      
      // Force CodeMirror to refresh after expansion animation
      setTimeout(() => {
        if (this.editor) {
          this.editor.requestMeasure();
        }
      }, 350);
    } else {
      // Collapse
      sidebar.style.width = '0px';
      sidebar.style.borderLeftWidth = '0px';
      sidebar.style.transition = 'width 0.3s ease, border-left-width 0s 0.3s';
      collapseBtn.style.right = '-1px';
      collapseBtn.innerHTML = '◀';
    }
    
    // Force chart to recalculate SVG dimensions after toggle animation completes
    setTimeout(() => {
      if (this.orgChart && this.chartContainer) {
        console.log('Re-rendering and fitting chart to new container bounds...');
        // Force SVG to update by calling render then fit
        this.orgChart.render().fit();
        
        // Reapply background pattern after re-render
        if (this.bgPattern) {
          setTimeout(() => applyBackgroundPattern(this.chartContainer!, this.bgPattern!, this.defaultOptions.patternColor), 50);
        }
      }
    }, 250);
  }

  /**
   * Jump to a specific line in the editor
   */
  private jumpToLine(lineNumber: number): void {
    if (!this.editor) return;
    jumpToEditorLine(this.editor, lineNumber);
  }

  /**
   * Set up keyboard shortcuts for the editor
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        this.toggleEditorAndFindSelectedNode();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        this.searchManager.focusFloatingSearch();
      }
    });
  }

  private toggleEditorAndFindSelectedNode(): void {
    const sidebar = document.getElementById(`ychart-editor-sidebar-${this.instanceId}`);
    if (!sidebar) return;

    const isCollapsed = sidebar.style.width === '0px';
    this.toggleEditor();

    if (isCollapsed) {
      setTimeout(() => this.scrollToSelectedNode(), 400);
    }
  }

  private scrollToSelectedNode(): void {
    if (!this.editor || !this.orgChart) return;
    const chartState = this.orgChart.getChartState();
    scrollToNodeInEditor(this.editor, chartState?.selectedNodeId);
  }

    private parseFrontMatter(content: string): FrontMatter {
    const result = parseFrontMatterFn(content, this.supervisorFields);
    if (result.updatedSupervisorFields) {
      this.supervisorFields = result.updatedSupervisorFields;
    }
    return result;
  }

            private resolveMissingParentIds(data: any[]): any[] {
    return resolveMissingParentIdsFn(data, this.nameField, this.supervisorFields);
  }

  /**
   * Configure the field names used for supervisor-based parentId resolution.
   * When a node is missing a parentId, the parser will attempt to find a parent
   * by matching the supervisor field value to another node's name field.
   * 
   * By default, the following fields are checked in order:
   * 'supervisor', 'reports', 'reports_to', 'manager', 'leader', 'parent'
   * 
   * @param supervisorFieldNames - The field(s) containing the supervisor's name. 
   *                               Can be a single string or an array of field names to check in order.
   * @param nameFieldName - The field containing the node's name for matching (default: 'name')
   */
  supervisorLookup(supervisorFieldNames: string | string[], nameFieldName: string = 'name'): this {
    this.supervisorFields = Array.isArray(supervisorFieldNames) ? supervisorFieldNames : [supervisorFieldNames];
    this.nameField = nameFieldName;
    
    // Re-render chart if already initialized
    if (this.orgChart) {
      this.renderChart();
    }
    
    return this;
  }

  /**
   * Set the initial Person of Interest (POI) programmatically.
   * @param selfValue - The id, name, email, or any field value that identifies the person.
   */
  self(selfValue: string | number | null): this {
    if (selfValue === null || selfValue === '') {
      this.poiManager.initialSelf = null;
      this.poiManager.selfApplied = false;
      if (this.orgChart && this.truthData.length > 0) {
        this.poiManager.setPersonOfInterest('');
      }
      return this;
    }

    this.poiManager.initialSelf = selfValue;
    this.poiManager.selfApplied = false;

    if (this.orgChart && this.truthData.length > 0) {
      const personId = this.poiManager.resolveSelfToPersonId(selfValue);
      if (personId) {
        this.poiManager.setPersonOfInterest(personId);
      }
      this.poiManager.selfApplied = true;
    }

    return this;
  }

  private renderChart(): void {
    try {
      if (this.forceGraph) {
        this.forceGraph.stop();
        this.forceGraph = null;
      }

      if (!this.editor) return;

      const yamlContent = this.editor.state.doc.toString();
      const { options: userOptions, schema: schemaDef, card: cardDef, data: yamlData } = this.parseFrontMatter(yamlContent);
      const options = { ...this.defaultOptions, ...userOptions };
      
      // Store current merged options for use by other methods (e.g., initializeHeightSync)
      this.currentOptions = options;
      
      // Capture 'self' option for initial POI (only on first render)
      if (!this.poiManager.selfApplied && options.self !== undefined) {
        this.poiManager.initialSelf = options.self;
      }
      
      let parsedData = jsyaml.load(yamlData);

      // Store current schema and card template for template access
      this.currentSchema = schemaDef;
      this.cardTemplate = cardDef || null;

      if (!Array.isArray(parsedData)) {
        throw new Error('YAML must be an array');
      }

      // Resolve missing parentId values by looking up supervisor names
      const resolvedData = this.resolveMissingParentIds(parsedData);

      // Store truth data (complete YAML) for POI filtering comparisons
      this.truthData = resolvedData;

      // Update POI selector with all people from truth data
      this.poiManager.updatePOISelector(resolvedData);

      // Build virtual data list - filters based on POI and expanded siblings
      const virtualData = this.poiManager.buildVirtualData(resolvedData);

      if (!this.orgChart) {
        this.orgChart = new OrgChart();
      }

      this.orgChart
        .container(`#ychart-chart-${this.instanceId}`)
        .data(virtualData)
        .nodeHeight(() => options.nodeHeight!)
        .nodeWidth(() => options.nodeWidth!)
        .childrenMargin(() => options.childrenMargin!)
        .compactMarginBetween(() => options.compactMarginBetween!)
        .compactMarginPair(() => options.compactMarginPair!)
        .neighbourMargin(() => options.neighbourMargin!)
        .onNodeClick((d: any, _i: number, _arr: any) => {
          // Handle column adjust mode first
          if (this.columnAdjustManager.isActive) {
            this.columnAdjustManager.handleNodeClick(d);
          }
          // Default: do nothing (selection is handled by d3-org-chart)
        })
        .onNodeDetailsClick((d: any) => {
          this.showNodeDetails(d.data);
        })
        .nodeContent((d: any) => this.getNodeContent(d))
        .render();
      
      // Set up pattern persistence observer (always, it will only act if bgPattern is set)
      setupPatternPersistence(this.chartContainer!, () => this.bgPattern, this.defaultOptions.patternColor);
      
      // Apply pattern immediately after render
      if (this.bgPattern) {
        // Small delay to ensure SVG is ready
        setTimeout(() => applyBackgroundPattern(this.chartContainer!, this.bgPattern!, this.defaultOptions.patternColor), 10);
      }
      
      // Fit to container bounds after render completes
      setTimeout(() => {
        if (this.orgChart && this.chartContainer) {
          this.orgChart.fit();
          
          // Reapply pattern after fit to ensure it persists
          if (this.bgPattern) {
            applyBackgroundPattern(this.chartContainer!, this.bgPattern!, this.defaultOptions.patternColor);
          }
          
          // Initialize height synchronization after nodes are rendered
          this.initializeHeightSync();
          
          // Apply initial 'self' POI if set in options (only once)
          this.poiManager.applyInitialSelf();
        }
      }, 100);
      
      this.currentView = 'hierarchy';
    } catch (error) {
      // Silently handle - linter will display errors in the editor
    }
  }

  private getNodeContent(d: any): string {
    const showExpandSiblings = this.poiManager.shouldShowExpandSiblings(d.data.id);
    const siblingsExpanded = this.poiManager.expandedSiblings.has(String(d.data.id));
    const siblingCount = showExpandSiblings ? this.poiManager.getSiblingCount(d.data.id) : 0;

    const { directSupervisor } = this.poiManager.getSupervisorChainInfo();
    const isTopmost = this.poiManager.isTopmostVisibleSupervisor(d.data.id);
    const showSupervisorChainBtn = isTopmost && directSupervisor !== null;
    const hiddenSupervisorCount = this.poiManager.getHiddenSupervisorCount(d.data.id);

    const poiButtons = {
      expandSiblingsBtn: buildExpandSiblingsBtn(d.data.id, showExpandSiblings, siblingsExpanded, siblingCount),
      expandSupervisorChainBtn: buildExpandSupervisorChainBtn(showSupervisorChainBtn, this.poiManager.supervisorChainExpanded, hiddenSupervisorCount),
    };

    return renderNodeContent(d, {
      currentSchema: this.currentSchema,
      cardTemplate: this.cardTemplate,
      customTemplate: this.customTemplate,
      currentOptions: this.currentOptions,
      defaultOptions: this.defaultOptions,
    }, poiButtons);
  }

  private showNodeDetails(data: any): void {
    if (!this.detailsPanel) return;
    this.detailsPanel.innerHTML = renderNodeDetails(data, this.instanceId);
    this.detailsPanel.style.display = 'block';
  }

          /**
   * Initialize node height synchronization service
   * Ensures all nodes have the same height based on the configured nodeHeight option
   */
  private initializeHeightSync(): void {
    if (!this.chartContainer) return;

    // Clean up existing service if any
    if (this.nodeHeightSync) {
      this.nodeHeightSync.destroy();
    }

    // Find the SVG container within the chart
    const svg = this.chartContainer.querySelector('svg');
    if (!svg) {
      console.warn('SVG not found for height sync');
      return;
    }

    // Get the configured nodeHeight - use current options (from YAML) or default
    const configuredNodeHeight = this.currentOptions.nodeHeight || this.defaultOptions.nodeHeight || 110;

    // Initialize the height sync service with fixed height from options
    this.nodeHeightSync = new NodeHeightSyncService(svg, {
      fixedHeight: configuredNodeHeight, // Use configured nodeHeight as the fixed height
      minHeight: configuredNodeHeight,   // Also set as minimum for safety
      maxHeight: 500, // Reasonable max to prevent excessive heights
      heightPadding: 0, // No extra padding since we're using fixed height
      resizeDebounce: 250, // Longer debounce for stability
      onHeightChange: (newHeight) => {
        // Only log in dev mode to reduce noise
        if (import.meta.env?.DEV) {
          console.log(`Node heights synchronized to: ${newHeight}px`);
        }
        
        // Update the org chart's node height setting
        // Use requestAnimationFrame to avoid interrupting render cycle
        if (this.orgChart) {
          requestAnimationFrame(() => {
            this.orgChart?.nodeHeight(() => newHeight);
            // Update the HTML overlay to reposition buttons after height change
            this.orgChart?.updateHtmlOverlay?.();
          });
        }
      }
    });

    // Perform initial sync
    this.nodeHeightSync.init();
  }

  private renderForceGraph(): void {
    try {
      if (!this.editor) return;

      const yamlContent = this.editor.state.doc.toString();
      const { data: yamlData } = this.parseFrontMatter(yamlContent);
      const parsedData = jsyaml.load(yamlData) as any[];

      if (!Array.isArray(parsedData)) {
        throw new Error('YAML must be an array');
      }

      // Resolve missing parentId values by looking up supervisor names
      const resolvedData = this.resolveMissingParentIds(parsedData);

      if (this.forceGraph) {
        this.forceGraph.stop();
      }

      this.forceGraph = new ForceGraph('ychart-chart', (data: any) => this.showNodeDetails(data));
      this.forceGraph.render(resolvedData);
      
      this.currentView = 'force';
    } catch (error) {
      // Silently handle - linter will display errors in the editor
    }
  }

  /**
   * Set background pattern style
   */
  bgPatternStyle(style: 'dotted' | 'dashed'): this {
    this.bgPattern = style;
    this.renderChart();
    return this;
  }

  /**
   * Set action button position and orientation
   */
  actionBtnPos(
    position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'topcenter' | 'bottomcenter',
    orientation: 'horizontal' | 'vertical'
  ): this {
    this.toolbarPosition = position;
    this.toolbarOrientation = orientation;
    
    // Recreate toolbar with new position
    if (this.toolbar && this.toolbar.parentElement) {
      const parent = this.toolbar.parentElement;
      parent.removeChild(this.toolbar);
      this.toolbar = this.createToolbar();
      parent.appendChild(this.toolbar);
    }
    
    return this;
  }

  /**
   * Set custom template function for node rendering
   * The function receives:
   * - d: node data object with d.data (your YAML properties), d.width, d.height
   * - schema: the schema definition from front matter
   */
  template(templateFn: (d: any, schema: SchemaDefinition) => string): this {
    this.customTemplate = templateFn;
    
    // Re-render chart with new template if already initialized
    if (this.orgChart) {
      this.renderChart();
    }
    
    return this;
  }

  private updateYAMLAfterSwap(data1: any, data2: any): void {
    try {
      if (!this.editor) return;

      this.isUpdatingProgrammatically = true;

      const yamlContent = this.editor.state.doc.toString();
      const { options: userOptions, schema: schemaDef, data: yamlData } = this.parseFrontMatter(yamlContent);
      const parsedData = jsyaml.load(yamlData);

      if (!Array.isArray(parsedData)) {
        console.error('Cannot update YAML: not an array');
        return;
      }

      const idx1 = parsedData.findIndex(item => String(item.id) === String(data1.id));
      const idx2 = parsedData.findIndex(item => String(item.id) === String(data2.id));

      if (idx1 === -1 || idx2 === -1) {
        console.error('Could not find nodes in YAML data');
        return;
      }

      [parsedData[idx1], parsedData[idx2]] = [parsedData[idx2], parsedData[idx1]];

      const frontMatter = `---
options:
${Object.entries(userOptions).map(([key, value]) => `  ${key}: ${value}`).join('\n')}
schema:
${Object.entries(schemaDef).map(([key, field]) => {
  const modifiers = [field.type, field.required ? 'required' : 'optional', field.missing ? 'missing' : ''].filter(Boolean);
  return `  ${key}: ${modifiers.join(' | ')}`;
}).join('\n')}
---

`;

      const newYamlData = jsyaml.dump(parsedData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });

      const newContent = frontMatter + newYamlData;

      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: newContent
        }
      });

      console.log(`Nodes swapped: ${data1.name} ↔ ${data2.name}`);
    } catch (error) {
      console.error('Error updating YAML after swap:', error);
    } finally {
      this.isUpdatingProgrammatically = false;
    }
  }

  /**
   * Get current YAML content
   */
  getYAML(): string {
    return this.editor?.state.doc.toString() || '';
  }

  /**
   * Update YAML content programmatically
   */
  setYAML(yamlContent: string): this {
    if (!this.editor) return this;

    this.isUpdatingProgrammatically = true;

    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: yamlContent
      }
    });

    this.isUpdatingProgrammatically = false;
    this.renderChart();

    return this;
  }

  /**
   * Inject CSS styles into Shadow DOM for style encapsulation.
   * This includes all CSS variables and library styles needed for YChart.
   */
  private injectShadowDOMStyles(): void {
    if (!this.shadowRoot) return;

    const styleElement = document.createElement('style');
    styleElement.textContent = getShadowDOMStyles();
    this.shadowRoot.appendChild(styleElement);
  }

    /**
   * Get the Shadow DOM root if Shadow DOM is enabled
   */
  getShadowRoot(): ShadowRoot | null {
    return this.shadowRoot;
  }

  /**
   * Check if Shadow DOM is enabled
   */
  isShadowDOMEnabled(): boolean {
    return this.useShadowDOM && this.shadowRoot !== null;
  }

  /**
   * Destroy the instance and clean up
   */
  destroy(): void {
    if (this.forceGraph) {
      this.forceGraph.stop();
    }
    if (this.editor) {
      this.editor.destroy();
    }
    if ((this as any)._patternObserver) {
      (this as any)._patternObserver.disconnect();
    }
    // Clean up all React roots
    unmountAllReactRoots();
    if (this.viewContainer) {
      this.viewContainer.innerHTML = '';
    }
  }
}

// Export for IIFE build - explicitly assign to window
if (typeof window !== "undefined") {
  (window as any).YChartEditor = YChartEditor;
}

export default YChartEditor;
