import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
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
  UserRole,
} from '../domain/models';
import {
  calculatePioneerYear,
  getCurrentTheocraticServiceMonth,
  getCurrentTheocraticServiceYear,
  getPreviousTheocraticServiceMonth,
} from '../domain/calculations';
import { getGroupNumbers } from '../domain/groups';
import {
  CongregationConfig,
  CreditEntry,
  DEFAULT_CONGREGATION_CONFIG,
  MonthlyReport,
  PioneerYearCalculation,
  ServiceMonthNumber,
} from '../domain/types';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_CONGREGATION,
  INITIAL_CREDITS,
  INITIAL_LOCKED_MONTHS,
  INITIAL_PIONEER_YEARS,
  INITIAL_PIONEERS,
  INITIAL_PRIVATE_NOTES,
  INITIAL_REPORTS,
  INITIAL_REVIEWS,
  INITIAL_SERVICE_YEARS,
  INITIAL_USER,
} from '../domain/mockData';
import { subscribeToAuthChanges, logoutUser } from '../services/auth';
import { firestoreSync } from '../services/firestoreSync';
import { isFirebaseConfigured } from '../services/firebase';

export interface PioneerHistoryItem {
  year: ServiceYear;
  yearRecord: PioneerYearRecord;
  calc: PioneerYearCalculation;
}

export interface ToastNotice {
  id: string;
  message: string;
  undoAction?: () => void;
}

interface AppContextType {
  congregation: Congregation;
  currentUser: UserProfile;
  firebaseUser: User | null;
  isCloudConnected: boolean;
  isOnline: boolean;
  currentYearId: string;
  refMonth: ServiceMonthNumber;
  serviceYears: ServiceYear[];
  pioneers: Pioneer[];
  pioneerYears: PioneerYearRecord[];
  reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
  credits: CreditEntry[];
  lockedMonths: MonthLockStatus[];
  privateNotes: PrivateNote[];
  reviews: PioneerReview[];
  auditLog: AuditLogEntry[];
  theme: 'light' | 'dark';

  // Auth & Cloud
  isAuthLoading: boolean;
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  handleLogout: () => Promise<void>;
  syncWithCloud: () => Promise<boolean>;

  // Secretary Onboarding Wizard
  isCongregationSetupOpen: boolean;
  openCongregationSetup: () => void;
  closeCongregationSetup: () => void;
  completeCongregationSetup: (data: {
    name: string;
    congregation_number?: string;
    groups_count: number;
    serviceYear: string;
    mode: 'clean' | 'excel' | 'sample';
  }) => void;
  loadSampleMockData: () => void;
  clearAllCongregationData: () => void;

  // Modals & Tools
  isExcelImportModalOpen: boolean;
  openExcelImportModal: () => void;
  closeExcelImportModal: () => void;

  // Toast / Undo
  toastNotice: ToastNotice | null;
  dismissToast: () => void;
  showToast: (message: string, undoAction?: () => void) => void;

  // State setters & Navigation
  setCurrentYearId: (yearId: string) => void;
  setRefMonth: (month: ServiceMonthNumber) => void;
  toggleRole: () => void;
  toggleTheme: () => void;

  // Business Actions
  addPioneerWithOnboarding: (data: {
    first_name: string;
    last_name: string;
    group_number: number;
    pioneer_since?: string;
    pioneer_type: 'regular' | 'salud_delicada';
    start_month: ServiceMonthNumber;
    goal_override?: number | null;
    approval_date?: string | null;
    s21_noted?: boolean;
    initial_reports?: { month: ServiceMonthNumber; preaching_hours: number; bible_studies?: number }[];
    initial_credits?: Omit<CreditEntry, 'id' | 'pioneerId' | 'yearId'>[];
  }) => string;

  updatePioneer: (pioneerId: string, updates: Partial<Pioneer>) => void;
  updatePioneerYear: (pioneerId: string, updates: Partial<PioneerYearRecord>) => void;
  togglePioneerActive: (pioneerId: string, active: boolean, reason?: string) => void;
  deletePioneer: (pioneerId: string) => void;

  saveMonthlyReport: (
    pioneerId: string,
    month: ServiceMonthNumber,
    preaching_hours: number,
    bible_studies?: number
  ) => boolean;

  addCreditEntry: (entry: Omit<CreditEntry, 'id'>) => boolean;
  deleteCreditEntry: (creditId: string) => void;

  savePrivateNote: (pioneerId: string, noteText: string) => void;
  getPrivateNote: (pioneerId: string) => string;

  toggleMonthLock: (month: ServiceMonthNumber) => void;
  isMonthLocked: (month: ServiceMonthNumber) => boolean;

  saveMarchReview: (pioneerId: string, date: string | null, notes?: string) => void;
  saveYearEndReview: (pioneerId: string, date: string | null, notes?: string) => void;

  closeServiceYear: (yearId: string) => void;
  reopenServiceYear: (yearId: string) => void;
  createNewServiceYear: (newYearLabel: string) => void;

  updateCongregationConfig: (newConfig: Partial<CongregationConfig>) => void;
  updateCongregation: (updates: Partial<Congregation>) => void;
  availableGroups: number[];

  // Multi-Year History & Data Portability
  getPioneerHistory: (pioneerId: string) => PioneerHistoryItem[];
  batchImportExcelData: (imported: {
    pioneers: Pioneer[];
    pioneerYears: PioneerYearRecord[];
    reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
    credits?: CreditEntry[];
  }) => void;
  resetCongregationData: () => void;

  // Computed Pioneer Calculations
  pioneerCalculations: Map<string, PioneerYearCalculation>;
  activePioneersForYear: {
    pioneer: Pioneer;
    yearRecord: PioneerYearRecord;
    calc: PioneerYearCalculation;
  }[];
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'precursores_app_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or use initial mock data with past-year baselines merged
  const [congregation, setCongregation] = useState<Congregation>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cong`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.groups_count || parsed.groups_count < 6) {
          parsed.groups_count = 6;
        }
        return parsed;
      } catch {
        return INITIAL_CONGREGATION;
      }
    }
    return INITIAL_CONGREGATION;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('precursores_demo_mode') === 'true';
  });
  const [isCongregationSetupOpen, setIsCongregationSetupOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<ToastNotice | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [serviceYears, setServiceYears] = useState<ServiceYear[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_years`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SERVICE_YEARS;
      }
    }
    return INITIAL_SERVICE_YEARS;
  });

  const [currentYearId, setCurrentYearId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_year_id`);
    return saved || getCurrentTheocraticServiceYear();
  });

  const [refMonth, setRefMonth] = useState<ServiceMonthNumber>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ref_month`);
    if (saved) {
      const parsed = Number(saved);
      if (parsed >= 1 && parsed <= 12) return parsed as ServiceMonthNumber;
    }
    return getPreviousTheocraticServiceMonth();
  });

  const [pioneers, setPioneers] = useState<Pioneer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pioneers`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return INITIAL_PIONEERS;
  });

  const [pioneerYears, setPioneerYears] = useState<PioneerYearRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pyears`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return INITIAL_PIONEER_YEARS;
  });

  const [reports, setReports] = useState<(MonthlyReport & { pioneerId: string; yearId: string })[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reports`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return INITIAL_REPORTS;
  });

  const [credits, setCredits] = useState<CreditEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_credits`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return INITIAL_CREDITS;
  });

  const [lockedMonths, setLockedMonths] = useState<MonthLockStatus[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_locked`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notes`);
    return saved ? JSON.parse(saved) : INITIAL_PRIVATE_NOTES;
  });

  const [reviews, setReviews] = useState<PioneerReview[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reviews`);
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOG;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_theme`);
    return (saved as 'light' | 'dark') || 'light';
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_KEY}_theme`, theme);
  }, [theme]);

  // Persist currentYearId and refMonth
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_year_id`, currentYearId);
  }, [currentYearId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ref_month`, String(refMonth));
  }, [refMonth]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          let profile = await firestoreSync.getUserProfile(user.uid);
          let congId = profile?.congregationId;

          if (!profile) {
            congId = `cong-${user.uid.slice(0, 8)}`;
            profile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Hermano Secretario',
              role: 'secretary',
              congregationId: congId,
            };
            await firestoreSync.saveUserProfile(profile);
          }

          setCurrentUser(profile);
          if (congId) {
            firestoreSync.setCongregationId(congId);

            const cloudCong = await firestoreSync.getCongregation(congId);
            if (cloudCong) {
              setCongregation(cloudCong);
              if (!cloudCong.setup_completed) {
                setIsCongregationSetupOpen(true);
              }
            } else {
              const newCong: Congregation = {
                id: congId,
                name: '',
                groups_count: 6,
                config: DEFAULT_CONGREGATION_CONFIG,
                createdAt: new Date().toISOString(),
                setup_completed: false,
              };
              setCongregation(newCong);
              setIsCongregationSetupOpen(true);
            }

            const cloudData = await firestoreSync.loadCongregationData();
            if (cloudData && cloudData.pioneers.length > 0) {
              setPioneers(cloudData.pioneers);
              setPioneerYears(cloudData.pioneerYears);
              setReports(cloudData.reports);
              setCredits(cloudData.credits);
              setReviews(cloudData.reviews);
              setLockedMonths(cloudData.lockedMonths);
              if (cloudData.serviceYears && cloudData.serviceYears.length > 0) {
                setServiceYears(cloudData.serviceYears);
              }
            } else if (!cloudCong?.setup_completed) {
              // Brand new congregation: start clean
              setPioneers([]);
              setPioneerYears([]);
              setReports([]);
              setCredits([]);
              setReviews([]);
              setLockedMonths([]);
            }
          }
        } catch (err) {
          console.warn('Sync con Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    sessionStorage.setItem('precursores_demo_mode', 'true');
    showToast('Modo de demostración activado.');
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    sessionStorage.removeItem('precursores_demo_mode');
    showToast('Modo de demostración desactivado.');
  };

  const openCongregationSetup = () => setIsCongregationSetupOpen(true);
  const closeCongregationSetup = () => setIsCongregationSetupOpen(false);

  const completeCongregationSetup = (data: {
    name: string;
    congregation_number?: string;
    groups_count: number;
    serviceYear: string;
    mode: 'clean' | 'excel' | 'sample';
  }) => {
    const updatedCong: Congregation = {
      ...congregation,
      name: data.name,
      congregation_number: data.congregation_number,
      groups_count: data.groups_count,
      setup_completed: true,
    };

    setCongregation(updatedCong);
    firestoreSync.saveCongregation(updatedCong);

    if (data.serviceYear && data.serviceYear !== currentYearId) {
      setCurrentYearId(data.serviceYear);
    }

    if (data.mode === 'clean' || data.mode === 'excel') {
      setPioneers([]);
      setPioneerYears([]);
      setReports([]);
      setCredits([]);
      setReviews([]);
      setLockedMonths([]);
    } else if (data.mode === 'sample') {
      setPioneers(INITIAL_PIONEERS);
      setPioneerYears(INITIAL_PIONEER_YEARS);
      setReports(INITIAL_REPORTS);
      setCredits(INITIAL_CREDITS);
      setReviews(INITIAL_REVIEWS);
      setLockedMonths(INITIAL_LOCKED_MONTHS);
    }

    setIsCongregationSetupOpen(false);
    showToast(`¡Congregación "${data.name}" configurada con éxito!`);
  };

  const loadSampleMockData = () => {
    setPioneers(INITIAL_PIONEERS);
    setPioneerYears(INITIAL_PIONEER_YEARS);
    setReports(INITIAL_REPORTS);
    setCredits(INITIAL_CREDITS);
    setReviews(INITIAL_REVIEWS);
    setLockedMonths(INITIAL_LOCKED_MONTHS);
    showToast('Datos de muestra cargados con éxito.');
  };

  const clearAllCongregationData = () => {
    setPioneers([]);
    setPioneerYears([]);
    setReports([]);
    setCredits([]);
    setReviews([]);
    setLockedMonths([]);
    showToast('Todos los precursores e informes han sido vaciados.');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleRole = () => {
    setCurrentUser((prev) => {
      const nextRole: UserRole = prev.role === 'secretary' ? 'viewer' : 'secretary';
      return {
        ...prev,
        role: nextRole,
        displayName: nextRole === 'secretary' ? 'Hermano Secretario' : 'Hermano Lector (Comité/Coordinador)',
      };
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setIsDemoMode(false);
    sessionStorage.removeItem('precursores_demo_mode');
    setCurrentUser(INITIAL_USER);
    showToast('Sesión cerrada correctamente.');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openExcelImportModal = () => setIsExcelImportModalOpen(true);
  const closeExcelImportModal = () => setIsExcelImportModalOpen(false);

  // Toast notification helper with undo
  const showToast = (message: string, undoAction?: () => void) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToastNotice({ id, message, undoAction });
    setTimeout(() => {
      setToastNotice((cur) => (cur?.id === id ? null : cur));
    }, 6000);
  };

  const dismissToast = () => setToastNotice(null);

  // Manual push/sync to Firestore cloud
  const syncWithCloud = async (): Promise<boolean> => {
    if (!isFirebaseConfigured) return false;
    try {
      await firestoreSync.syncLocalToCloud({
        congregation,
        pioneers,
        pioneerYears,
        reports,
        credits,
        reviews,
        lockedMonths,
        serviceYears,
      });
      showToast('Sincronización con la nube completada.');
      return true;
    } catch (e) {
      console.error('Error sincronizando con la nube:', e);
      showToast('Error al conectar con la nube.');
      return false;
    }
  };

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cong`, JSON.stringify(congregation));
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
    localStorage.setItem(`${STORAGE_KEY}_pioneers`, JSON.stringify(pioneers));
    localStorage.setItem(`${STORAGE_KEY}_pyears`, JSON.stringify(pioneerYears));
    localStorage.setItem(`${STORAGE_KEY}_reports`, JSON.stringify(reports));
    localStorage.setItem(`${STORAGE_KEY}_credits`, JSON.stringify(credits));
    localStorage.setItem(`${STORAGE_KEY}_locked`, JSON.stringify(lockedMonths));
    localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(privateNotes));
    localStorage.setItem(`${STORAGE_KEY}_reviews`, JSON.stringify(reviews));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLog));
    localStorage.setItem(`${STORAGE_KEY}_years`, JSON.stringify(serviceYears));
  }, [congregation, currentUser, pioneers, pioneerYears, reports, credits, lockedMonths, privateNotes, reviews, auditLog, serviceYears]);

  const addAudit = (action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      uid: currentUser.uid,
      user_email: currentUser.email,
      action,
      entity,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [newEntry, ...prev]);
    firestoreSync.appendAuditLog(newEntry);
  };

  const isCurrentYearClosed = useMemo(() => {
    return Boolean(serviceYears.find((y) => y.id === currentYearId)?.closed);
  }, [serviceYears, currentYearId]);

  const isMonthLocked = (month: ServiceMonthNumber) => {
    if (isCurrentYearClosed) return true;
    return lockedMonths.some((lm) => lm.yearId === currentYearId && lm.month === month && lm.sent);
  };

  // Add Pioneer with Onboarding
  const addPioneerWithOnboarding = (data: {
    first_name: string;
    last_name: string;
    group_number: number;
    pioneer_since?: string;
    pioneer_type: 'regular' | 'salud_delicada';
    start_month: ServiceMonthNumber;
    goal_override?: number | null;
    approval_date?: string | null;
    s21_noted?: boolean;
    initial_reports?: { month: ServiceMonthNumber; preaching_hours: number; bible_studies?: number }[];
    initial_credits?: Omit<CreditEntry, 'id' | 'pioneerId' | 'yearId'>[];
  }): string => {
    if (isCurrentYearClosed) {
      console.warn('No se puede dar de alta precursores en un año cerrado.');
      return '';
    }

    const newPioneerId = `p-${Date.now()}`;
    const newPioneer: Pioneer = {
      id: newPioneerId,
      first_name: data.first_name,
      last_name: data.last_name,
      group_number: data.group_number,
      active: true,
      pioneer_since: data.pioneer_since || `${currentYearId.slice(0, 4)}-09-01`,
    };

    const newPioneerYear: PioneerYearRecord = {
      id: `${newPioneerId}_${currentYearId}`,
      pioneerId: newPioneerId,
      yearId: currentYearId,
      pioneer_type: data.pioneer_type,
      start_month: data.start_month,
      goal_override: data.goal_override,
      approval_date: data.approval_date,
      s21_noted: data.s21_noted,
    };

    setPioneers((prev) => [...prev, newPioneer]);
    setPioneerYears((prev) => [...prev, newPioneerYear]);
    firestoreSync.savePioneer(newPioneer);
    firestoreSync.savePioneerYear(newPioneerYear);

    if (data.initial_reports && data.initial_reports.length > 0) {
      const newReports = data.initial_reports.map((r) => ({
        pioneerId: newPioneerId,
        yearId: currentYearId,
        month: r.month,
        preaching_hours: r.preaching_hours,
        bible_studies: r.bible_studies || 0,
      }));
      setReports((prev) => [...prev, ...newReports]);
      newReports.forEach((r) => firestoreSync.saveReport(newPioneerId, currentYearId, r));
    }

    if (data.initial_credits && data.initial_credits.length > 0) {
      const newCredits = data.initial_credits.map((c, index) => ({
        ...c,
        id: `cred-${Date.now()}-${index}`,
        pioneerId: newPioneerId,
        yearId: currentYearId,
      }));
      setCredits((prev) => [...prev, ...newCredits]);
      newCredits.forEach((c) => firestoreSync.saveCredit(c));
    }

    addAudit(
      'create',
      'pioneer',
      `Alta de precursor: ${data.first_name} ${data.last_name} (Grupo ${data.group_number}, tipo: ${data.pioneer_type})`
    );

    showToast(`Precursor dado de alta: ${data.first_name} ${data.last_name}`);
    return newPioneerId;
  };

  const updatePioneer = (pioneerId: string, updates: Partial<Pioneer>) => {
    if (currentUser.role !== 'secretary') return;
    setPioneers((prev) =>
      prev.map((p) => {
        if (p.id === pioneerId) {
          const updated = { ...p, ...updates };
          firestoreSync.savePioneer(updated);
          return updated;
        }
        return p;
      })
    );
    addAudit('update', 'pioneer', `Actualizados datos de precursor ${pioneerId}`);
  };

  const updatePioneerYear = (pioneerId: string, updates: Partial<PioneerYearRecord>) => {
    if (currentUser.role !== 'secretary') return;
    if (isCurrentYearClosed) return;
    setPioneerYears((prev) =>
      prev.map((py) => {
        if (py.pioneerId === pioneerId && py.yearId === currentYearId) {
          const updated = { ...py, ...updates };
          firestoreSync.savePioneerYear(updated);
          return updated;
        }
        return py;
      })
    );
    addAudit('update', 'pioneer', `Actualizada configuración del año de servicio para precursor ${pioneerId}`);
  };

  const togglePioneerActive = (pioneerId: string, active: boolean, reason?: string) => {
    if (currentUser.role !== 'secretary') return;
    setPioneers((prev) =>
      prev.map((p) => {
        if (p.id === pioneerId) {
          const updated = { ...p, active };
          firestoreSync.savePioneer(updated);
          return updated;
        }
        return p;
      })
    );
    addAudit(
      'update',
      'pioneer',
      `Precursor ${pioneerId} marcado como ${active ? 'activo' : 'baja/inactivo'}${reason ? ` (${reason})` : ''}`
    );
    showToast(`Precursor marcado como ${active ? 'activo' : 'inactivo'}`);
  };

  const deletePioneer = (pioneerId: string) => {
    if (currentUser.role !== 'secretary') {
      showToast('Solo el secretario puede eliminar precursores.');
      return;
    }

    const pioneerToDelete = pioneers.find((p) => p.id === pioneerId);
    const pioneerName = pioneerToDelete
      ? `${pioneerToDelete.first_name} ${pioneerToDelete.last_name}`
      : 'Precursor';

    setPioneers((prev) => prev.filter((p) => p.id !== pioneerId));
    setPioneerYears((prev) => prev.filter((py) => py.pioneerId !== pioneerId));
    setReports((prev) => prev.filter((r) => r.pioneerId !== pioneerId));
    setCredits((prev) => prev.filter((c) => c.pioneerId !== pioneerId));
    setReviews((prev) => prev.filter((rv) => rv.pioneerId !== pioneerId));
    setPrivateNotes((prev) => prev.filter((n) => n.pioneerId !== pioneerId));

    addAudit('delete', 'pioneer', `Precursor ${pioneerName} (${pioneerId}) eliminado definitivamente.`);
    firestoreSync.deletePioneer(pioneerId);
    showToast(`Precursor ${pioneerName} eliminado correctamente.`);
  };

  const saveMonthlyReport = (
    pioneerId: string,
    month: ServiceMonthNumber,
    preaching_hours: number,
    bible_studies = 0
  ): boolean => {
    if (currentUser.role !== 'secretary') return false;
    if (isCurrentYearClosed) return false;
    if (isMonthLocked(month)) return false;

    const previousReport = reports.find(
      (r) => r.pioneerId === pioneerId && r.yearId === currentYearId && r.month === month
    );
    const oldHours = previousReport ? previousReport.preaching_hours : undefined;
    const oldStudies = previousReport ? previousReport.bible_studies : undefined;

    setReports((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.pioneerId === pioneerId && r.yearId === currentYearId && r.month === month
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          preaching_hours,
          bible_studies,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            pioneerId,
            yearId: currentYearId,
            month,
            preaching_hours,
            bible_studies,
          },
        ];
      }
    });

    firestoreSync.saveReport(pioneerId, currentYearId, {
      month,
      preaching_hours,
      bible_studies,
    });

    addAudit('update', 'report', `Informe guardado: precursor ${pioneerId}, mes ${month}: ${preaching_hours} h`);

    // Show toast with Undo option
    showToast(`Informe mes ${month} guardado (${preaching_hours} h)`, () => {
      if (oldHours !== undefined) {
        saveMonthlyReport(pioneerId, month, oldHours, oldStudies);
      }
    });

    return true;
  };

  const addCreditEntry = (entry: Omit<CreditEntry, 'id'>): boolean => {
    if (currentUser.role !== 'secretary') return false;
    if (isCurrentYearClosed) return false;
    if (isMonthLocked(entry.month)) return false;

    const newId = `cred-${Date.now()}`;
    const newEntry: CreditEntry = { ...entry, id: newId };
    setCredits((prev) => [...prev, newEntry]);
    firestoreSync.saveCredit(newEntry);
    addAudit('create', 'credit', `Crédito agregado (${entry.kind}, ${entry.hours} h) en mes ${entry.month}`);

    showToast(`Crédito de ${entry.hours} h registrado`, () => {
      deleteCreditEntry(newId);
    });

    return true;
  };

  const deleteCreditEntry = (creditId: string) => {
    if (currentUser.role !== 'secretary') return;
    if (isCurrentYearClosed) return;
    const toDelete = credits.find((c) => c.id === creditId);
    setCredits((prev) => prev.filter((c) => c.id !== creditId));
    firestoreSync.deleteCredit(creditId);
    addAudit('delete', 'credit', `Crédito eliminado id ${creditId}`);

    if (toDelete) {
      showToast(`Crédito de ${toDelete.hours} h eliminado`, () => {
        setCredits((prev) => [...prev, toDelete]);
        firestoreSync.saveCredit(toDelete);
      });
    }
  };

  const savePrivateNote = (pioneerId: string, noteText: string) => {
    if (currentUser.role !== 'secretary') return;
    const newNote: PrivateNote = {
      pioneerId,
      note: noteText,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email,
    };
    setPrivateNotes((prev) => {
      const index = prev.findIndex((n) => n.pioneerId === pioneerId);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = newNote;
        return copy;
      }
      return [...prev, newNote];
    });
    firestoreSync.savePrivateNote(pioneerId, newNote);
    addAudit('update', 'note', `Nota confidencial actualizada para precursor ${pioneerId}`);
  };

  const getPrivateNote = (pioneerId: string): string => {
    if (currentUser.role !== 'secretary') return '';
    const found = privateNotes.find((n) => n.pioneerId === pioneerId);
    return found ? found.note : '';
  };

  const toggleMonthLock = (month: ServiceMonthNumber) => {
    if (currentUser.role !== 'secretary') return;
    if (isCurrentYearClosed) {
      showToast('El año de servicio se encuentra cerrado (solo lectura).');
      return;
    }
    if (isCurrentYearClosed) return;

    setLockedMonths((prev) => {
      const id = `${currentYearId}_${month}`;
      const index = prev.findIndex((lm) => lm.id === id);
      if (index >= 0) {
        const currentSent = prev[index].sent;
        const copy = [...prev];
        const updatedStatus: MonthLockStatus = {
          ...copy[index],
          sent: !currentSent,
          sentAt: new Date().toISOString(),
          sentBy: currentUser.email,
        };
        copy[index] = updatedStatus;
        firestoreSync.saveMonthLock(updatedStatus);
        addAudit(
          !currentSent ? 'lock_month' : 'unlock_month',
          'report',
          `Mes ${month} ${!currentSent ? 'bloqueado (enviado)' : 'desbloqueado'}`
        );
        return copy;
      } else {
        const newStatus: MonthLockStatus = {
          id,
          yearId: currentYearId,
          month,
          sent: true,
          sentAt: new Date().toISOString(),
          sentBy: currentUser.email,
        };
        firestoreSync.saveMonthLock(newStatus);
        addAudit('lock_month', 'report', `Mes ${month} bloqueado (enviado)`);
        return [...prev, newStatus];
      }
    });
  };

  const saveMarchReview = (pioneerId: string, date: string | null, notes?: string) => {
    if (currentUser.role !== 'secretary') return;
    if (isCurrentYearClosed) return;

    const id = `${pioneerId}_${currentYearId}`;
    setReviews((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      let updatedReview: PioneerReview;
      if (index >= 0) {
        const copy = [...prev];
        updatedReview = {
          ...copy[index],
          march_meeting_date: date,
          march_meeting_notes: notes ?? copy[index].march_meeting_notes,
        };
        copy[index] = updatedReview;
        firestoreSync.saveReview(updatedReview);
        return copy;
      } else {
        updatedReview = {
          id,
          pioneerId,
          yearId: currentYearId,
          march_meeting_date: date,
          march_meeting_notes: notes || '',
        };
        firestoreSync.saveReview(updatedReview);
        return [...prev, updatedReview];
      }
    });
  };

  const saveYearEndReview = (pioneerId: string, date: string | null, notes?: string) => {
    if (currentUser.role !== 'secretary') return;
    if (isCurrentYearClosed) return;

    const id = `${pioneerId}_${currentYearId}`;
    setReviews((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      let updatedReview: PioneerReview;
      if (index >= 0) {
        const copy = [...prev];
        updatedReview = {
          ...copy[index],
          year_end_review_date: date,
          year_end_notes: notes ?? copy[index].year_end_notes,
        };
        copy[index] = updatedReview;
        firestoreSync.saveReview(updatedReview);
        return copy;
      } else {
        updatedReview = {
          id,
          pioneerId,
          yearId: currentYearId,
          year_end_review_date: date,
          year_end_notes: notes || '',
        };
        firestoreSync.saveReview(updatedReview);
        return [...prev, updatedReview];
      }
    });
  };

  const closeServiceYear = (yearId: string) => {
    if (currentUser.role !== 'secretary') return;
    setServiceYears((prev) =>
      prev.map((y) => {
        if (y.id === yearId) {
          const updated = { ...y, closed: true };
          firestoreSync.saveServiceYear(updated);
          return updated;
        }
        return y;
      })
    );
    addAudit('close_year', 'service_year', `Año de servicio ${yearId} cerrado`);
    showToast(`Año de servicio ${yearId} cerrado exitosamente.`);
  };

  const reopenServiceYear = (yearId: string) => {
    if (currentUser.role !== 'secretary') return;
    setServiceYears((prev) =>
      prev.map((y) => {
        if (y.id === yearId) {
          const updated = { ...y, closed: false };
          firestoreSync.saveServiceYear(updated);
          return updated;
        }
        return y;
      })
    );
    addAudit('update', 'service_year', `Año de servicio ${yearId} reabierto`);
    showToast(`Año de servicio ${yearId} reabierto.`);
  };

  const createNewServiceYear = (newYearLabel: string) => {
    if (currentUser.role !== 'secretary') return;
    const newYearId = newYearLabel.split(' ')[0];
    const newYear: ServiceYear = {
      id: newYearId,
      label: newYearLabel,
      start_date: `${newYearId.slice(0, 4)}-09-01`,
      end_date: `${newYearId.slice(5, 9)}-08-31`,
      closed: false,
    };
    setServiceYears((prev) => [newYear, ...prev]);
    firestoreSync.saveServiceYear(newYear);

    // Copiar precursores activos con mes_inicio = 1 (Septiembre) según Plan.md Secciones 4.9 y 9
    const newPioneerYears: PioneerYearRecord[] = pioneers
      .filter((p) => p.active)
      .map((p) => {
        const existingPY = pioneerYears.find((py) => py.pioneerId === p.id && py.yearId === currentYearId);
        return {
          id: `${p.id}_${newYearId}`,
          pioneerId: p.id,
          yearId: newYearId,
          pioneer_type: existingPY?.pioneer_type || 'regular',
          start_month: 1, // Año completo en el nuevo ciclo de servicio
          goal_override: null,
          approval_date: existingPY?.approval_date,
          s21_noted: existingPY?.s21_noted,
        };
      });

    setPioneerYears((prev) => [...prev, ...newPioneerYears]);
    newPioneerYears.forEach((py) => firestoreSync.savePioneerYear(py));
    setCurrentYearId(newYearId);
    addAudit('create', 'service_year', `Iniciado nuevo año de servicio: ${newYearLabel}`);
    showToast(`Iniciado nuevo año de servicio: ${newYearLabel}`);
  };

  const updateCongregation = (updates: Partial<Congregation>) => {
    if (currentUser.role !== 'secretary') return;
    const updatedCong: Congregation = {
      ...congregation,
      ...updates,
      config: updates.config ? { ...congregation.config, ...updates.config } : congregation.config,
    };
    setCongregation(updatedCong);
    firestoreSync.saveCongregation(updatedCong);
    addAudit('update', 'congregation', 'Datos de congregación actualizados');
    showToast('Congregación actualizada.');
  };

  const updateCongregationConfig = (newConfig: Partial<CongregationConfig>) => {
    updateCongregation({ config: { ...congregation.config, ...newConfig } });
  };

  // Multi-Year History Calculation for a pioneer
  const getPioneerHistory = (pioneerId: string): PioneerHistoryItem[] => {
    return serviceYears
      .map((year) => {
        const yearRecord = pioneerYears.find(
          (py) => py.pioneerId === pioneerId && py.yearId === year.id
        );
        if (!yearRecord) return null;

        const yearReports = reports.filter(
          (r) => r.pioneerId === pioneerId && r.yearId === year.id
        );
        const yearCredits = credits.filter(
          (c) => c.pioneerId === pioneerId && c.yearId === year.id
        );

        const calc = calculatePioneerYear(
          yearRecord,
          yearReports,
          yearCredits,
          year.closed ? 12 : refMonth,
          congregation.config
        );

        return {
          year,
          yearRecord,
          calc,
        };
      })
      .filter((item): item is PioneerHistoryItem => item !== null);
  };

  // Batch import from Excel
  const batchImportExcelData = (imported: {
    pioneers: Pioneer[];
    pioneerYears: PioneerYearRecord[];
    reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
    credits?: CreditEntry[];
  }) => {
    if (currentUser.role !== 'secretary') return;

    // Merge pioneers
    setPioneers((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newItems = imported.pioneers.filter((p) => !existingIds.has(p.id));
      const updated = prev.map((p) => {
        const match = imported.pioneers.find((imp) => imp.id === p.id);
        return match ? { ...p, ...match } : p;
      });
      return [...updated, ...newItems];
    });

    // Merge pioneer years
    setPioneerYears((prev) => {
      const existingIds = new Set(prev.map((py) => py.id));
      const newItems = imported.pioneerYears.filter((py) => !existingIds.has(py.id));
      const updated = prev.map((py) => {
        const match = imported.pioneerYears.find((imp) => imp.id === py.id);
        return match ? { ...py, ...match } : py;
      });
      return [...updated, ...newItems];
    });

    // Merge reports
    setReports((prev) => {
      const key = (r: any) => `${r.pioneerId}_${r.yearId}_${r.month}`;
      const map = new Map(prev.map((r) => [key(r), r]));
      imported.reports.forEach((r) => map.set(key(r), r));
      return Array.from(map.values());
    });

    if (imported.credits && imported.credits.length > 0) {
      setCredits((prev) => [...prev, ...imported.credits!]);
    }

    addAudit(
      'create',
      'pioneer',
      `Importación masiva completada: ${imported.pioneers.length} precursores y ${imported.reports.length} informes.`
    );
    showToast(`Importación completada: ${imported.pioneers.length} precursores procesados.`);
  };

  // Reset congregation data
  const resetCongregationData = () => {
    if (currentUser.role !== 'secretary') return;
    localStorage.clear();
    setPioneers(INITIAL_PIONEERS);
    setPioneerYears(INITIAL_PIONEER_YEARS);
    setReports(INITIAL_REPORTS);
    setCredits(INITIAL_CREDITS);
    setServiceYears(INITIAL_SERVICE_YEARS);
    setLockedMonths(INITIAL_LOCKED_MONTHS);
    setPrivateNotes(INITIAL_PRIVATE_NOTES);
    setReviews(INITIAL_REVIEWS);
    setAuditLog(INITIAL_AUDIT_LOG);
    setCongregation(INITIAL_CONGREGATION);
    showToast('Datos de la congregación restablecidos con éxito.');
  };

  // Computations for all pioneers in the current year
  const pioneerCalculations = useMemo(() => {
    const map = new Map<string, PioneerYearCalculation>();

    pioneers.forEach((pioneer) => {
      const yearRecord = pioneerYears.find(
        (py) => py.pioneerId === pioneer.id && py.yearId === currentYearId
      );
      if (!yearRecord) return;

      const pioneerReports = reports.filter(
        (r) => r.pioneerId === pioneer.id && r.yearId === currentYearId
      );
      const pioneerCredits = credits.filter(
        (c) => c.pioneerId === pioneer.id && c.yearId === currentYearId
      );

      const calc = calculatePioneerYear(
        yearRecord,
        pioneerReports,
        pioneerCredits,
        refMonth,
        congregation.config
      );

      map.set(pioneer.id, calc);
    });

    return map;
  }, [pioneers, pioneerYears, currentYearId, reports, credits, refMonth, congregation.config]);

  const activePioneersForYear = useMemo(() => {
    return pioneers
      .filter((p) => p.active)
      .map((pioneer) => {
        const yearRecord = pioneerYears.find(
          (py) => py.pioneerId === pioneer.id && py.yearId === currentYearId
        );
        const calc = yearRecord ? pioneerCalculations.get(pioneer.id) : null;
        return {
          pioneer,
          yearRecord: yearRecord!,
          calc: calc!,
        };
      })
      .filter((item) => Boolean(item.yearRecord && item.calc));
  }, [pioneers, pioneerYears, currentYearId, pioneerCalculations]);

  const availableGroups = useMemo(() => {
    const assigned = pioneers.map((p) => p.group_number).filter(Boolean);
    return getGroupNumbers(congregation.groups_count || 5, assigned);
  }, [congregation.groups_count, pioneers]);

  return (
    <AppContext.Provider
      value={{
        congregation,
        currentUser,
        firebaseUser,
        isCloudConnected: Boolean(firebaseUser || isFirebaseConfigured),
        isOnline,
        currentYearId,
        refMonth,
        serviceYears,
        pioneers,
        pioneerYears,
        reports,
        credits,
        lockedMonths,
        privateNotes,
        reviews,
        auditLog,
        theme,
        isAuthLoading,
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        handleLogout,
        syncWithCloud,
        isCongregationSetupOpen,
        openCongregationSetup,
        closeCongregationSetup,
        completeCongregationSetup,
        loadSampleMockData,
        clearAllCongregationData,
        isExcelImportModalOpen,
        openExcelImportModal,
        closeExcelImportModal,
        toastNotice,
        dismissToast,
        showToast,
        setCurrentYearId,
        setRefMonth,
        toggleRole,
        toggleTheme,
        addPioneerWithOnboarding,
        updatePioneer,
        updatePioneerYear,
        togglePioneerActive,
        deletePioneer,
        saveMonthlyReport,
        addCreditEntry,
        deleteCreditEntry,
        savePrivateNote,
        getPrivateNote,
        toggleMonthLock,
        isMonthLocked,
        saveMarchReview,
        saveYearEndReview,
        closeServiceYear,
        reopenServiceYear,
        createNewServiceYear,
        updateCongregationConfig,
        updateCongregation,
        availableGroups,
        getPioneerHistory,
        batchImportExcelData,
        resetCongregationData,
        pioneerCalculations,
        activePioneersForYear,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
