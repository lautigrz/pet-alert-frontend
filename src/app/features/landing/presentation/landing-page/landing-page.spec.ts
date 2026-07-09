import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  const buildComponent = () => {
    TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent(LandingPage);
  };

  const firstCardName = (fixture: ReturnType<typeof buildComponent>) =>
    fixture.nativeElement
      .querySelector('.found-track')
      .firstElementChild.querySelector('.found-name')
      .textContent.trim();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('el CTA principal lleva al inicio de la app', () => {
    // Given la landing renderizada
    const fixture = buildComponent();
    fixture.detectChanges();

    // When se busca el CTA destacado
    const cta = fixture.nativeElement.querySelector('.button-cta');

    // Then dice "Empezá acá" y apunta a la raíz (que redirige a login)
    expect(cta.getAttribute('href')).toBe('/');
    expect(cta.textContent.trim()).toBe('Empezá acá');
  });

  it('scrollTo lleva a la sección y evita la navegación por hash', () => {
    // Given la landing montada y una sección objetivo
    const fixture = buildComponent();
    fixture.detectChanges();
    const scrollIntoView = vi.fn();
    const target = { scrollIntoView } as unknown as HTMLElement;
    const getById = vi.spyOn(document, 'getElementById').mockReturnValue(target);
    const event = { preventDefault: vi.fn() } as unknown as Event;

    // When se dispara el scroll a esa sección
    fixture.componentInstance.scrollTo('beneficios', event);

    // Then se cancela el salto por hash y se hace scroll suave a la sección
    expect(event.preventDefault).toHaveBeenCalled();
    expect(getById).toHaveBeenCalledWith('beneficios');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    getById.mockRestore();
    fixture.destroy();
  });

  it('next() mueve la primera tarjeta al final del carrusel', () => {
    // Given el carrusel con la primera historia visible
    const fixture = buildComponent();
    fixture.detectChanges();
    expect(firstCardName(fixture)).toBe('Mishi');

    // When avanza y termina la transición
    fixture.componentInstance.next();
    vi.advanceTimersByTime(550);

    // Then la segunda historia pasa a ser la primera
    expect(firstCardName(fixture)).toBe('Rocco');

    fixture.destroy();
  });

  it('un swipe hacia la izquierda avanza a la siguiente funcionalidad', () => {
    // Given el carrusel de funcionalidades en la primera
    const fixture = buildComponent();
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[name="features-carousel"]',
    );
    expect(radios[0].checked).toBe(true);

    // When se desliza el dedo hacia la izquierda
    fixture.componentInstance.onSwipeStart({
      changedTouches: [{ clientX: 220 }],
    } as unknown as TouchEvent);
    fixture.componentInstance.onFeatureSwipeEnd({
      changedTouches: [{ clientX: 100 }],
    } as unknown as TouchEvent);

    // Then queda seleccionada la segunda funcionalidad
    expect(radios[1].checked).toBe(true);

    fixture.destroy();
  });

  it('en la última funcionalidad, seguir deslizando se queda en el tope', () => {
    // Given el carrusel parado en la última funcionalidad
    const fixture = buildComponent();
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[name="features-carousel"]',
    );
    const last = radios.length - 1;
    radios[last].checked = true;

    // When se sigue deslizando hacia la izquierda
    fixture.componentInstance.onSwipeStart({
      changedTouches: [{ clientX: 220 }],
    } as unknown as TouchEvent);
    fixture.componentInstance.onFeatureSwipeEnd({
      changedTouches: [{ clientX: 100 }],
    } as unknown as TouchEvent);

    // Then no pasa del tope: sigue en la última
    expect(radios[last].checked).toBe(true);

    fixture.destroy();
  });

  it('prev() trae la última tarjeta al principio', () => {
    // Given el carrusel con la primera historia visible
    const fixture = buildComponent();
    fixture.detectChanges();
    expect(firstCardName(fixture)).toBe('Mishi');

    // When retrocede
    fixture.componentInstance.prev();
    vi.advanceTimersByTime(550);

    // Then la última historia pasa a ser la primera
    expect(firstCardName(fixture)).toBe('Nina');

    fixture.destroy();
  });
});
