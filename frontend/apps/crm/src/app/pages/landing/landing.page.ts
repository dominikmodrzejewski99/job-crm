import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'jt-landing-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage {
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }
}
