import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const OAUTH_SCOPE = 'openid email profile';

interface CodeResponse {
  code?: string;
  error?: string;
}

interface CodeClient {
  requestCode(): void;
}

declare const google: {
  accounts: {
    oauth2: {
      initCodeClient(config: {
        client_id: string;
        scope: string;
        ux_mode: 'popup';
        callback: (response: CodeResponse) => void;
        error_callback: (error: { type?: string }) => void;
      }): CodeClient;
    };
  };
};

@Injectable({ providedIn: 'root' })
export class GoogleIdentityClient {
  private scriptPromise?: Promise<void>;

  async requestAuthCode(): Promise<string> {
    await this.loadScript();
    return new Promise<string>((resolve, reject) => this.buildCodeClient(resolve, reject).requestCode());
  }

  private buildCodeClient(resolve: (code: string) => void, reject: (error: Error) => void): CodeClient {
    return google.accounts.oauth2.initCodeClient({
      client_id: environment.googleClientId,
      scope: OAUTH_SCOPE,
      ux_mode: 'popup',
      callback: (response) =>
        response.code ? resolve(response.code) : reject(new Error(response.error ?? 'google_no_code')),
      error_callback: (error) => reject(new Error(error.type ?? 'google_popup_closed')),
    });
  }

  private loadScript(): Promise<void> {
    return (this.scriptPromise ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('google_script_failed'));
      document.head.appendChild(script);
    }));
  }
}
