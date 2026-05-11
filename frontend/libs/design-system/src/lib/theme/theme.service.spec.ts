import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('initializes from the data-theme attribute when nothing is stored', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('light');
  });

  it('switches theme and persists to localStorage', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ThemeService);
    svc.setTheme('dark');
    expect(svc.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('jobtrack:theme')).toBe('dark');
  });

  it('toggle() flips the theme', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ThemeService);
    const before = svc.theme();
    svc.toggle();
    expect(svc.theme()).not.toBe(before);
  });
});
