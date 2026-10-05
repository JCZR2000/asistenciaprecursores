import { describe, it, expect } from 'vitest';
import { getFriendlyAuthErrorMessage } from '../auth';
import { FirestoreSyncService } from '../firestoreSync';
import { INITIAL_CONGREGATION } from '../../domain/mockData';

describe('Auth and Onboarding Flow Services', () => {
  it('translates common Firebase authentication errors to friendly Spanish messages', () => {
    expect(getFriendlyAuthErrorMessage('auth/invalid-credential')).toBe(
      'Correo o contraseña incorrectos. Por favor verifica tus datos.'
    );
    expect(getFriendlyAuthErrorMessage('auth/wrong-password')).toBe(
      'Correo o contraseña incorrectos. Por favor verifica tus datos.'
    );
    expect(getFriendlyAuthErrorMessage('auth/user-not-found')).toBe(
      'Correo o contraseña incorrectos. Por favor verifica tus datos.'
    );
    expect(getFriendlyAuthErrorMessage('auth/email-already-in-use')).toBe(
      'Ya existe una cuenta con este correo electrónico.'
    );
    expect(getFriendlyAuthErrorMessage('auth/weak-password')).toBe(
      'La contraseña debe tener al menos 6 caracteres.'
    );
    expect(getFriendlyAuthErrorMessage('auth/invalid-email')).toBe(
      'El formato del correo electrónico no es válido.'
    );
    expect(getFriendlyAuthErrorMessage('auth/popup-closed-by-user')).toBe(
      'Se cerró la ventana de inicio de sesión de Google.'
    );
    expect(getFriendlyAuthErrorMessage('unknown-error-code')).toBe(
      'Ocurrió un error al procesar la autenticación.'
    );
  });

  it('FirestoreSyncService correctly manages and updates dynamic congregation IDs', () => {
    const sync = new FirestoreSyncService('cong-initial');
    expect(sync.getCongregationId()).toBe('cong-initial');

    sync.setCongregationId('cong-real-99');
    expect(sync.getCongregationId()).toBe('cong-real-99');
  });

  it('INITIAL_CONGREGATION has setup_completed marked as true by default', () => {
    expect(INITIAL_CONGREGATION.setup_completed).toBe(true);
    expect(INITIAL_CONGREGATION.groups_count).toBeGreaterThanOrEqual(6);
  });
});
