/**
 * Barrel export for all YChart modules.
 * Provides a single import point for the main ychartEditor.
 */

// Types & constants
export { YCHART_VERSION } from './types';
export type { YChartOptions, SchemaDefinition, CardElement, CardConfig, FieldSchema, FrontMatter } from './types';

// Utilities
export { generateUUID, escapeHtml, escapeRegex, fuzzyMatch } from './utils';

// Data parsing & transformation
export { parseFrontMatter, parseSchemaField } from './yamlParser';
export { resolveMissingParentIds } from './dataTransform';
export { replaceVariables, renderCardElement } from './templates';

// Visualization
export { ForceGraph } from './forceGraph';
export type { ForceGraphNode, ForceGraphLink } from './forceGraph';
export { applyBackgroundPattern, setupPatternPersistence, createDotPattern, createGridPattern } from './patterns';

// UI components
export { createToolbar, toolbarIcons } from './toolbar';
export type { ToolbarConfig } from './toolbar';
export { SearchManager } from './search';
export type { SearchContext } from './search';
export { ColumnAdjustManager } from './columnAdjust';
export type { ColumnAdjustContext } from './columnAdjust';

// Editor
export { createEditor, updateErrorBanner, jumpToEditorLine, formatYAML, scrollToNodeInEditor, createYamlLinter } from './editorSetup';
export type { EditorSetupContext } from './editorSetup';

// Node rendering
export { buildExpandSiblingsBtn, buildExpandSupervisorChainBtn, renderNodeContent, renderNodeDetails } from './nodeRenderer';
export type { NodeRenderContext, POIButtonData } from './nodeRenderer';

// POI (Person of Interest)
export { buildVirtualData, shouldShowExpandSiblings, getSiblingCount, getSupervisorChainInfo, isTopmostVisibleSupervisor, getHiddenSupervisorCount } from './poi';
export type { POIState } from './poi';
export { POIManager } from './poiManager';
export type { POIManagerContext } from './poiManager';

// Layout
export { buildLayout } from './layoutBuilder';
export type { LayoutElements, LayoutConfig } from './layoutBuilder';

// Shadow DOM
export { getShadowDOMStyles } from './shadowDomStyles';

// Services
export { NodeHeightSyncService, createNodeHeightSync } from './nodeHeightSyncService';
export type { NodeHeightSyncConfig } from './nodeHeightSyncService';

// React bridge
export { renderSelect, unmountAllReactRoots, unmountReactRoot, renderButton, renderBadge, renderBadgeList, renderAlert, renderInput, renderTooltipButton, renderCheckboxItem, renderToolbar } from './reactBridge';
export type { RenderSelectConfig, RenderButtonConfig, RenderBadgeConfig, RenderAlertConfig, RenderInputConfig, RenderTooltipButtonConfig, RenderCheckboxItemConfig, ToolbarButtonConfig, SelectOption } from './reactBridge';
