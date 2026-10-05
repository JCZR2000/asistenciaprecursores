import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase no está configurado. Revisa las variables en .env');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase no está configurado. Revisa las variables en .env');
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase no está configurado. Revisa las variables en .env');
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth no disponible');
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Por favor verifica tus datos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo electrónico.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de inicio de sesión de Google.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Revisa tu red.';
    default:
      return 'Ocurrió un error al procesar la autenticación.';
  }
}
