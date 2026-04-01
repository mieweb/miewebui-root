import type { SidebarManager } from './sidebarManager';
import type { SearchManager } from './search';

export interface ShortcutManagerContext {
  getSidebarManager: () => SidebarManager;
  getSearchManager: () => SearchManager;
}

export class ShortcutManager {
  private ctx: ShortcutManagerContext;
  private handleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  constructor(ctx: ShortcutManagerContext) {
    this.ctx = ctx;
  }

  init(): void {
    this.handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        this.ctx.getSidebarManager().toggleAndScrollToNode();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        this.ctx.getSearchManager().focusFloatingSearch();
      }
    };

    document.addEventListener('keydown', this.handleKeyDown);
  }

  destroy(): void {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
  }
}
