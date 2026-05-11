import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DsButton } from '@frontend/design-system/button';
import { DsInput } from '@frontend/design-system/input';
import { DsToastService } from '@frontend/design-system/toast';

import { AuthService } from './auth.service';

@Component({
  selector: 'register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsInput, DsButton, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './login.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(DsToastService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly displayName = signal('');
  protected readonly attempted = signal(false);
  protected readonly loading = signal(false);

  private readonly emailValid = computed(() => /\S+@\S+\.\S+/.test(this.email().trim()));
  private readonly passwordValid = computed(() => this.password().length >= 8);

  protected readonly emailError = computed(() => this.attempted() && !this.emailValid());
  protected readonly passwordError = computed(() => this.attempted() && !this.passwordValid());
  protected readonly formValid = computed(() => this.emailValid() && this.passwordValid());

  protected submit(): void {
    this.attempted.set(true);
    if (!this.formValid()) return;

    this.loading.set(true);
    this.auth
      .register({
        email: this.email().trim(),
        password: this.password(),
        displayName: this.displayName().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Konto utworzone — witaj!');
          this.router.navigate(['/app']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.status === 409
            ? 'Ten email jest już zarejestrowany'
            : 'Rejestracja nie powiodła się';
          this.toast.error(msg);
        },
      });
  }
}
