import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage implements AfterViewInit, OnDestroy {
  @ViewChild('foundTrack') private readonly foundTrack?: ElementRef<HTMLElement>;
  @ViewChild('featCarousel') private readonly featCarousel?: ElementRef<HTMLElement>;

  private readonly swipeThreshold = 40;
  private touchStartX = 0;

  private readonly stepInterval = 3000;
  private readonly slideDuration = 550;
  private readonly transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
  private readonly onVisibility = () => this.handleVisibility();

  private animating = false;
  private hovering = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit(): void {
    const track = this.foundTrack?.nativeElement;
    if (!track || track.children.length < 2) return;
    track.style.setProperty('transition', this.transition, 'important');
    document.addEventListener('visibilitychange', this.onVisibility);
    this.start();
  }

  ngOnDestroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  next(): void {
    this.advance();
  }

  prev(): void {
    this.rewind();
  }

  onEnter(): void {
    this.hovering = true;
    this.stop();
  }

  onLeave(): void {
    this.hovering = false;
    this.start();
  }

  onSwipeStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  onFoundSwipeEnd(event: TouchEvent): void {
    const delta = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(delta) < this.swipeThreshold) return;
    if (delta < 0) this.next();
    else this.prev();
  }

  onFeatureSwipeEnd(event: TouchEvent): void {
    const delta = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(delta) < this.swipeThreshold) return;
    this.moveFeature(delta < 0 ? 1 : -1);
  }

  private moveFeature(direction: number): void {
    const radios = this.featureRadios();
    if (!radios.length) return;
    const current = radios.findIndex((radio) => radio.checked);
    const target = Math.min(radios.length - 1, Math.max(0, current + direction));
    radios[target].checked = true;
  }

  private featureRadios(): HTMLInputElement[] {
    const element = this.featCarousel?.nativeElement;
    if (!element) return [];
    return Array.from(element.querySelectorAll('input[name="features-carousel"]'));
  }

  private start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.advance(), this.stepInterval);
  }

  private stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private handleVisibility(): void {
    if (document.hidden) this.stop();
    else if (!this.hovering) this.start();
  }

  private step(track: HTMLElement): number {
    const first = track.children[0] as HTMLElement;
    const second = track.children[1] as HTMLElement;
    return second.offsetLeft - first.offsetLeft;
  }

  private advance(): void {
    const track = this.foundTrack?.nativeElement;
    if (!track || this.animating) return;
    this.animating = true;
    track.style.transform = `translateX(${-this.step(track)}px)`;
    setTimeout(() => this.finishAdvance(track), this.slideDuration);
  }

  private finishAdvance(track: HTMLElement): void {
    track.style.setProperty('transition', 'none', 'important');
    track.appendChild(track.firstElementChild!);
    track.style.transform = 'translateX(0px)';
    void track.offsetWidth;
    track.style.setProperty('transition', this.transition, 'important');
    this.animating = false;
  }

  private rewind(): void {
    const track = this.foundTrack?.nativeElement;
    if (!track || this.animating) return;
    this.animating = true;
    track.style.setProperty('transition', 'none', 'important');
    track.insertBefore(track.lastElementChild!, track.firstElementChild);
    track.style.transform = `translateX(${-this.step(track)}px)`;
    void track.offsetWidth;
    track.style.setProperty('transition', this.transition, 'important');
    track.style.transform = 'translateX(0px)';
    setTimeout(() => this.finishRewind(), this.slideDuration);
  }

  private finishRewind(): void {
    this.animating = false;
  }
}
