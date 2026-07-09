import { Component, signal } from '@angular/core';

const DISMISS_KEY = 'petfinder-ios-install-dismissed';

@Component({
  selector: 'app-ios-install-banner',
  standalone: true,
  templateUrl: './ios-install-banner.component.html',
})
export class IosInstallBannerComponent {
  readonly visible = signal(this.shouldShow());

  dismiss(): void {
    localStorage.setItem(DISMISS_KEY, '1');
    this.visible.set(false);
  }

  private shouldShow(): boolean {
    return this.isIOS() && this.isSafari() && !this.isStandalone() && !this.isDismissed();
  }

  private isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private isSafari(): boolean {
    return !/crios|fxios|edgios|opios/i.test(navigator.userAgent);
  }

  private isStandalone(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  }

  private isDismissed(): boolean {
    return localStorage.getItem(DISMISS_KEY) === '1';
  }
}
