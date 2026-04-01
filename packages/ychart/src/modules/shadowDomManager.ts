import { getShadowDOMStyles } from './shadowDomStyles';

export class ShadowDOMManager {
  private shadowRoot: ShadowRoot | null = null;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Attach a Shadow DOM to the host element and return the inner container.
   * If Shadow DOM is not enabled, returns the host element directly.
   */
  attachTo(host: HTMLElement): HTMLElement {
    if (!this.enabled) {
      return host;
    }

    this.shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles into Shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = getShadowDOMStyles();
    this.shadowRoot.appendChild(styleElement);

    // Create a container inside the shadow root
    const shadowContainer = document.createElement('div');
    shadowContainer.style.cssText = 'width:100%;height:100%;';
    this.shadowRoot.appendChild(shadowContainer);

    return shadowContainer;
  }

  getRoot(): ShadowRoot | null {
    return this.shadowRoot;
  }

  isEnabled(): boolean {
    return this.enabled && this.shadowRoot !== null;
  }
}
