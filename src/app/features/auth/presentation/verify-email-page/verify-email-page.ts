import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { InvalidVerificationTokenError } from '../../domain/auth.errors';

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
      await this.redirectToLogin('error');
      return;
    }
    try {
      await this.authService.verifyEmail(token);
      await this.redirectToLogin('ok');
    } catch (error) {
      if (error instanceof InvalidVerificationTokenError) {
        await this.redirectToLogin('error');
        return;
      }
      this.status.set('retry');
    }
  }

  private redirectToLogin(verified: 'ok' | 'error'): Promise<boolean> {
    return this.router.navigate(['/login'], { queryParams: { verified } });
  }
}
