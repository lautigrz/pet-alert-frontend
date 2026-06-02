import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { InvalidVerificationTokenError } from '../../domain/auth.errors';
import { ToastService } from '../../../../shared/application/toast.service';
import { TokenStorage } from '../../infrastructure/token.storage';

type VerifyStatus = 'verifying' | 'retry';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email-page.html',
  styleUrl: './verify-email-page.css',
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorage);

  readonly status = signal<VerifyStatus>('verifying');

  ngOnInit(): void {
    void this.verify();
  }

  async retry(): Promise<void> {
    this.status.set('verifying');
    await this.verify();
  }

  private async verify(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      await this.finish('error');
      return;
    }
    try {
      await this.authService.verifyEmail(token);
      await this.finish('ok');
    } catch (error) {
      if (error instanceof InvalidVerificationTokenError) {
        await this.finish('error');
        return;
      }
      this.status.set('retry');
    }
  }

  private async finish(verified: 'ok' | 'error'): Promise<void> {
    if (this.tokenStorage.read()?.accessToken) {
      if (verified === 'ok') {
        this.toastService.success('¡Tu cuenta fue verificada!');
      } else {
        this.toastService.error('El enlace de verificación es inválido o expiró.');
      }
      await this.router.navigateByUrl('/home');
      return;
    }
    await this.router.navigate(['/login'], { queryParams: { verified } });
  }
}
