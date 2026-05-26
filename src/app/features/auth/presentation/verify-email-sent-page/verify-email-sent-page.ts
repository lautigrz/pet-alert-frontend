import { Component } from '@angular/core';

@Component({
  selector: 'app-verify-email-sent-page',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <section class="max-w-md text-center bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <h1 class="text-2xl font-bold text-[#12355B] mb-3">Mirá tu correo</h1>
        <p class="text-slate-600">
          Te enviamos un link de verificación. Hacé click para activar tu cuenta.
        </p>
      </section>
    </div>
  `,
})
export class VerifyEmailSentPage {}
