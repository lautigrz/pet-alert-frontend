import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordsMatch =
  (passwordKey: string, confirmKey: string): ValidatorFn =>
  (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  };
