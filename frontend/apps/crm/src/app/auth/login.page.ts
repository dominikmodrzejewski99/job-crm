import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DsToastService } from '@frontend/design-system/toast';

import { AuthService } from './auth.service';

@Component({
  selector: 'login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(DsToastService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly attempted = signal(false);
  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);

  private readonly emailValid = computed(() => /\S+@\S+\.\S+/.test(this.email().trim()));
  private readonly passwordValid = computed(() => this.password().length >= 8);

  protected readonly emailError = computed(() => this.attempted() && !this.emailValid());
  protected readonly passwordError = computed(() => this.attempted() && !this.passwordValid());
  protected readonly formValid = computed(() => this.emailValid() && this.passwordValid());

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected submit(): void {
    this.attempted.set(true);
    if (!this.formValid()) return;

    this.loading.set(true);
    this.auth
      .login({ email: this.email().trim(), password: this.password() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Zalogowano');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.status === 401
            ? 'Niepoprawny email lub hasło'
            : 'Logowanie nie powiodło się';
          this.toast.error(msg);
        },
      });
  }
}
