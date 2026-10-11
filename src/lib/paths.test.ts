import { describe, expect, it } from 'vitest';
import { appUrl, isCurrentPath, joinBase } from './paths';

describe('joinBase', () => {
  it('pagina nella radice', () => {
    expect(joinBase('/', '/')).toBe('/');
    expect(joinBase('/', '/settings')).toBe('/settings/');
    expect(joinBase('/', 'settings/')).toBe('/settings/');
  });

  it('pagina in un percorso del sito, con o senza barra finale nella base', () => {
    expect(joinBase('/workout-tracker/', '/')).toBe('/workout-tracker/');
    expect(joinBase('/workout-tracker', '/settings')).toBe('/workout-tracker/settings/');
    expect(joinBase('/workout-tracker/', '')).toBe('/workout-tracker/');
  });

  it('query string e ancora restano dopo la barra', () => {
    expect(joinBase('/workout-tracker/', '/session?id=abc')).toBe('/workout-tracker/session/?id=abc');
    expect(joinBase('/', '/settings#data')).toBe('/settings/#data');
    expect(joinBase('/', '/?x=1')).toBe('/?x=1');
  });

  it('i file non prendono la barra finale', () => {
    expect(joinBase('/workout-tracker/', '/sw.js')).toBe('/workout-tracker/sw.js');
    expect(joinBase('/', '/fonts/atkinson-hyperlegible-next-latin.woff2')).toBe('/fonts/atkinson-hyperlegible-next-latin.woff2');
    expect(joinBase('/', '/manifest.webmanifest')).toBe('/manifest.webmanifest');
  });
});

describe('appUrl e isCurrentPath (base dei test: /)', () => {
  it('appUrl usa la base della build', () => {
    expect(appUrl('/calendar')).toBe('/calendar/');
  });

  it('riconosce la pagina corrente con o senza barra finale', () => {
    expect(isCurrentPath('/calendar', '/calendar')).toBe(true);
    expect(isCurrentPath('/calendar/', '/calendar')).toBe(true);
    expect(isCurrentPath('/', '/')).toBe(true);
    expect(isCurrentPath('/routines/', '/calendar')).toBe(false);
  });
});
