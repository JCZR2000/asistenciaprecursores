import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  AuditLogEntry,
  Congregation,
  MonthLockStatus,
  Pioneer,
  PioneerReview,
  PioneerYearRecord,
  PrivateNote,
  ServiceYear,
  UserProfile,
} from '../domain/models';
import { CreditEntry, MonthlyReport } from '../domain/types';

export class FirestoreSyncService {
  private congId: string;

  constructor(congId = 'cong-central-01') {
    this.congId = congId;
  }

  public setCongregationId(newId: string) {
    this.congId = newId;
  }

  public getCongregationId(): string {
    return this.congId;
  }

  // --- User Profiles ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) return null;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      console.warn('Firestore getUserProfile error:', e);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    } catch (e) {
      console.warn('Firestore saveUserProfile error:', e);
    }
  }

  async getCongregation(congId: string): Promise<Congregation | null> {
    if (!isFirebaseConfigured || !db) return null;
    try {
      const snap = await getDoc(doc(db, 'congregations', congId));
      if (snap.exists()) {
        return snap.data() as Congregation;
      }
      return null;
    } catch (e) {
      console.warn('Firestore getCongregation error:', e);
      return null;
    }
  }

  // --- Pioneers ---
  async savePioneer(pioneer: Pioneer): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'pioneers', pioneer.id);
      await setDoc(ref, pioneer, { merge: true });
    } catch (e) {
      console.warn('Firestore savePioneer error:', e);
    }
  }

  async deletePioneer(pioneerId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'pioneers', pioneerId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore deletePioneer error:', e);
    }
  }

  async savePioneerYear(py: PioneerYearRecord): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'pioneerYears', py.id);
      await setDoc(ref, py, { merge: true });
    } catch (e) {
      console.warn('Firestore savePioneerYear error:', e);
    }
  }

  // --- Reports ---
  async saveReport(
    pioneerId: string,
    yearId: string,
    report: MonthlyReport
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const docId = `${pioneerId}_${yearId}_${report.month}`;
      const ref = doc(db, 'congregations', this.congId, 'reports', docId);
      await setDoc(
        ref,
        {
          pioneerId,
          yearId,
          month: report.month,
          preaching_hours: report.preaching_hours,
          bible_studies: report.bible_studies || 0,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore saveReport error:', e);
    }
  }

  // --- Credits ---
  async saveCredit(credit: CreditEntry): Promise<void> {
    if (!isFirebaseConfigured || !db || !credit.id) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'creditEntries', credit.id);
      await setDoc(ref, credit, { merge: true });
    } catch (e) {
      console.warn('Firestore saveCredit error:', e);
    }
  }

  async deleteCredit(creditId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'creditEntries', creditId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore deleteCredit error:', e);
    }
  }

  // --- Private Notes ---
  async savePrivateNote(pioneerId: string, note: PrivateNote): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'privateNotes', pioneerId);
      await setDoc(ref, note, { merge: true });
    } catch (e) {
      console.warn('Firestore savePrivateNote error:', e);
    }
  }

  // --- Month Lock Status ---
  async saveMonthLock(lockStatus: MonthLockStatus): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'monthStatus', lockStatus.id);
      await setDoc(ref, lockStatus, { merge: true });
    } catch (e) {
      console.warn('Firestore saveMonthLock error:', e);
    }
  }

  // --- Reviews ---
  async saveReview(review: PioneerReview): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'reviews', review.id);
      await setDoc(ref, review, { merge: true });
    } catch (e) {
      console.warn('Firestore saveReview error:', e);
    }
  }

  // --- Audit Log ---
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'auditLog', entry.id);
      await setDoc(ref, entry);
    } catch (e) {
      console.warn('Firestore appendAuditLog error:', e);
    }
  }

  // --- Service Years ---
  async saveServiceYear(year: ServiceYear): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', this.congId, 'serviceYears', year.id);
      await setDoc(ref, year, { merge: true });
    } catch (e) {
      console.warn('Firestore saveServiceYear error:', e);
    }
  }

  // --- Congregation Config ---
  async saveCongregation(cong: Congregation): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'congregations', cong.id);
      await setDoc(ref, cong, { merge: true });
    } catch (e) {
      console.warn('Firestore saveCongregation error:', e);
    }
  }

  // --- Cloud Sync: Pull from Firestore ---
  async loadCongregationData(): Promise<{
    pioneers: Pioneer[];
    pioneerYears: PioneerYearRecord[];
    reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
    credits: CreditEntry[];
    reviews: PioneerReview[];
    lockedMonths: MonthLockStatus[];
    serviceYears: ServiceYear[];
  } | null> {
    if (!isFirebaseConfigured || !db) return null;
    try {
      const pSnap = await getDocs(collection(db, 'congregations', this.congId, 'pioneers'));
      if (pSnap.empty) {
        return null;
      }

      const pySnap = await getDocs(collection(db, 'congregations', this.congId, 'pioneerYears'));
      const repSnap = await getDocs(collection(db, 'congregations', this.congId, 'reports'));
      const credSnap = await getDocs(collection(db, 'congregations', this.congId, 'creditEntries'));
      const revSnap = await getDocs(collection(db, 'congregations', this.congId, 'reviews'));
      const lockSnap = await getDocs(collection(db, 'congregations', this.congId, 'monthStatus'));
      const yrSnap = await getDocs(collection(db, 'congregations', this.congId, 'serviceYears'));

      return {
        pioneers: pSnap.docs.map((d) => d.data() as Pioneer),
        pioneerYears: pySnap.docs.map((d) => d.data() as PioneerYearRecord),
        reports: repSnap.docs.map((d) => d.data() as MonthlyReport & { pioneerId: string; yearId: string }),
        credits: credSnap.docs.map((d) => d.data() as CreditEntry),
        reviews: revSnap.docs.map((d) => d.data() as PioneerReview),
        lockedMonths: lockSnap.docs.map((d) => d.data() as MonthLockStatus),
        serviceYears: yrSnap.docs.map((d) => d.data() as ServiceYear),
      };
    } catch (e) {
      console.warn('Could not load data from Firestore:', e);
      return null;
    }
  }

  // --- Cloud Sync: Push initial/local dataset to Firestore ---
  async syncLocalToCloud(local: {
    congregation: Congregation;
    pioneers: Pioneer[];
    pioneerYears: PioneerYearRecord[];
    reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
    credits: CreditEntry[];
    reviews: PioneerReview[];
    lockedMonths: MonthLockStatus[];
    serviceYears: ServiceYear[];
  }): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      await this.saveCongregation(local.congregation);
      await Promise.all(local.pioneers.map((p) => this.savePioneer(p)));
      await Promise.all(local.pioneerYears.map((py) => this.savePioneerYear(py)));
      await Promise.all(local.reports.map((r) => this.saveReport(r.pioneerId, r.yearId, r)));
      await Promise.all(local.credits.map((c) => this.saveCredit(c)));
      await Promise.all(local.reviews.map((rv) => this.saveReview(rv)));
      await Promise.all(local.lockedMonths.map((lm) => this.saveMonthLock(lm)));
      await Promise.all(local.serviceYears.map((y) => this.saveServiceYear(y)));
    } catch (e) {
      console.warn('Error during syncLocalToCloud:', e);
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
