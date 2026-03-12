/**
 * React Bridge - renders @mieweb/ui React components into vanilla DOM containers.
 * Provides factory functions for each UI component type used in YChart.
 */
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '@mieweb/ui/styles.css';
import './styles/mieweb-ui-overrides.css';
import {
  Select as MieSelect,
  Button as MieButton,
  Badge as MieBadge,
  Alert as MieAlert,
  AlertTitle as MieAlertTitle,
  AlertDescription as MieAlertDescription,
  Input as MieInput,
  Tooltip as MieTooltip,
  Checkbox as MieCheckbox,
  type SelectOption,
} from '@mieweb/ui';

// Track all React roots for cleanup
const rootRegistry = new Map<HTMLElement, Root>();

function getOrCreateRoot(container: HTMLElement): Root {
  let root = rootRegistry.get(container);
  if (!root) {
    container.classList.add('mw-ui');
    root = createRoot(container);
    rootRegistry.set(container, root);
  }
  return root;
}

/** Unmount a React root from a container */
export function unmountReactRoot(container: HTMLElement): void {
  const root = rootRegistry.get(container);
  if (root) {
    root.unmount();
    rootRegistry.delete(container);
  }
}

/** Unmount all tracked React roots (for cleanup on destroy) */
export function unmountAllReactRoots(): void {
  rootRegistry.forEach((root) => {
    root.unmount();
  });
  rootRegistry.clear();
}

// ─── Select ──────────────────────────────────────────────────────────────────

export interface RenderSelectConfig {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  label?: string;
  hideLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  searchable?: boolean;
}

export function renderSelect(container: HTMLElement, config: RenderSelectConfig): void {
  const root = getOrCreateRoot(container);
  root.render(<ControlledSelect config={config} />);
}

function ControlledSelect({ config }: { config: RenderSelectConfig }) {
  const [value, setValue] = React.useState(config.value);

  // Sync with external value changes (e.g., when options are refreshed)
  React.useEffect(() => {
    setValue(config.value);
  }, [config.value]);

  return (
    <MieSelect
      options={config.options}
      value={value}
      placeholder={config.placeholder ?? 'Select...'}
      label={config.label}
      hideLabel={config.hideLabel ?? true}
      size={config.size ?? 'sm'}
      disabled={config.disabled}
      onValueChange={(val: string) => {
        setValue(val);
        config.onValueChange?.(val);
      }}
      aria-label={config.ariaLabel}
      className={config.className}
      searchable={config.searchable}
    />
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────

export interface RenderButtonConfig {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: string; // SVG string for icon content
  className?: string;
  fullWidth?: boolean;
}

/** Helper to create a React element from an SVG string */
function SvgIcon({ svg }: { svg: string }) {
  return <span dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'flex', alignItems: 'center' }} />;
}

function ButtonWithIcon({ config }: { config: RenderButtonConfig }) {
  const iconEl = config.icon ? <SvgIcon svg={config.icon} /> : null;
  return (
    <MieButton
      variant={config.variant ?? 'primary'}
      size={config.size ?? 'sm'}
      onClick={config.onClick}
      disabled={config.disabled}
      aria-label={config.ariaLabel ?? config.label}
      className={config.className}
      fullWidth={config.fullWidth}
      leftIcon={iconEl}
    >
      {config.label}
    </MieButton>
  );
}

export function renderButton(container: HTMLElement, config: RenderButtonConfig): void {
  const root = getOrCreateRoot(container);
  root.render(<ButtonWithIcon config={config} />);
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export interface RenderBadgeConfig {
  text: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  ariaLabel?: string;
}

function BadgeWithRemove({ config }: { config: RenderBadgeConfig }) {
  return (
    <MieBadge
      variant={config.variant ?? 'default'}
      size={config.size ?? 'sm'}
      aria-label={config.ariaLabel}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {config.text}
      </span>
      {config.onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); config.onRemove!(); }}
          aria-label={`Remove ${config.text}`}
          style={{
            background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
            fontSize: '1em', lineHeight: 1, padding: 0, marginLeft: '2px',
            display: 'flex', alignItems: 'center',
          }}
        >
          &times;
        </button>
      )}
    </MieBadge>
  );
}

export function renderBadge(container: HTMLElement, config: RenderBadgeConfig): void {
  const root = getOrCreateRoot(container);
  root.render(<BadgeWithRemove config={config} />);
}

/** Render a list of badges into a container */
export function renderBadgeList(
  container: HTMLElement,
  badges: RenderBadgeConfig[],
  clearAll?: { label: string; onClick: () => void },
): void {
  const root = getOrCreateRoot(container);
  root.render(
    <>
      {badges.map((b, i) => (
        <BadgeWithRemove key={`${b.text}-${i}`} config={b} />
      ))}
      {clearAll && badges.length > 0 && (
        <MieButton
          variant="danger"
          size="sm"
          onClick={clearAll.onClick}
          aria-label={clearAll.label}
          leftIcon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          }
        >
          Clear
        </MieButton>
      )}
    </>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export interface RenderAlertConfig {
  title?: string;
  message: string;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function renderAlert(container: HTMLElement, config: RenderAlertConfig): void {
  const root = getOrCreateRoot(container);
  root.render(
    <MieAlert
      variant={config.variant ?? 'danger'}
      dismissible={config.dismissible}
      onDismiss={config.onDismiss}
    >
      {config.title && <MieAlertTitle>{config.title}</MieAlertTitle>}
      <MieAlertDescription>{config.message}</MieAlertDescription>
    </MieAlert>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

export interface RenderInputConfig {
  value?: string;
  placeholder?: string;
  label?: string;
  hideLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

function ControlledInput({ config }: { config: RenderInputConfig }) {
  const [value, setValue] = React.useState(config.value ?? '');

  // Sync external value changes
  React.useEffect(() => {
    if (config.value !== undefined) setValue(config.value);
  }, [config.value]);

  return (
    <MieInput
      value={value}
      placeholder={config.placeholder}
      label={config.label}
      hideLabel={config.hideLabel ?? true}
      size={config.size ?? 'md'}
      aria-label={config.ariaLabel}
      className={config.className}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        config.onChange?.(e.target.value);
      }}
      onFocus={config.onFocus}
      onBlur={config.onBlur}
      onKeyDown={config.onKeyDown}
    />
  );
}

export function renderInput(container: HTMLElement, config: RenderInputConfig): void {
  const root = getOrCreateRoot(container);
  root.render(<ControlledInput config={config} />);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

export interface RenderTooltipButtonConfig {
  icon: string; // SVG string
  tooltip: string;
  onClick?: () => void;
  isActive?: boolean;
  activeColor?: string;
  ariaLabel?: string;
  badge?: string; // e.g. "!" for experimental
}

function TooltipButton({ config }: { config: RenderTooltipButtonConfig }) {
  return (
    <MieTooltip content={config.tooltip} placement="top">
      <button
        onClick={config.onClick}
        aria-label={config.ariaLabel ?? config.tooltip}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'var(--yc-width-toolbar-button)',
          height: 'var(--yc-height-toolbar-button)',
          border: 'none',
          background: config.isActive ? (config.activeColor ?? 'var(--yc-color-primary)') : 'transparent',
          color: config.isActive ? 'white' : 'var(--yc-color-icon)',
          cursor: 'pointer',
          borderRadius: 'var(--yc-border-radius-lg)',
          transition: 'all var(--yc-transition-fast)',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!config.isActive) {
            (e.currentTarget as HTMLElement).style.background = 'var(--yc-color-primary)';
            (e.currentTarget as HTMLElement).style.color = 'white';
            (e.currentTarget as HTMLElement).style.transform = 'var(--yc-transform-button-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!config.isActive) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--yc-color-icon)';
          }
          (e.currentTarget as HTMLElement).style.transform = 'var(--yc-transform-button-active)';
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: config.icon }} style={{ display: 'flex' }} />
        {config.badge && (
          <MieBadge
            variant="warning"
            size="sm"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: 'var(--yc-height-badge)',
              height: 'var(--yc-height-badge)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--yc-border-radius-full)',
              padding: 0,
            }}
          >
            {config.badge}
          </MieBadge>
        )}
      </button>
    </MieTooltip>
  );
}

export function renderTooltipButton(container: HTMLElement, config: RenderTooltipButtonConfig): void {
  const root = getOrCreateRoot(container);
  root.render(<TooltipButton config={config} />);
}

// ─── Checkbox Item ───────────────────────────────────────────────────────────

export interface RenderCheckboxItemConfig {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function renderCheckboxItem(container: HTMLElement, config: RenderCheckboxItemConfig): void {
  const root = getOrCreateRoot(container);
  root.render(
    <MieCheckbox
      label={config.label}
      checked={config.checked}
      size={config.size ?? 'sm'}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => config.onChange(e.target.checked)}
    />
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export interface ToolbarButtonConfig {
  id: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
  isActive?: boolean;
  activeColor?: string;
  badge?: string;
}

export function renderToolbar(
  container: HTMLElement,
  buttons: ToolbarButtonConfig[],
): void {
  const root = getOrCreateRoot(container);
  root.render(
    <>
      {buttons.map((btn) => (
        <TooltipButton
          key={btn.id}
          config={{
            icon: btn.icon,
            tooltip: btn.tooltip,
            onClick: btn.onClick,
            isActive: btn.isActive,
            activeColor: btn.activeColor,
            ariaLabel: btn.tooltip,
            badge: btn.badge,
          }}
        />
      ))}
    </>
  );
}

// Re-export types for convenience
export type { SelectOption };
