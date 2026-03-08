import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AppSettings,
  AppStore,
  DailyRecord,
  defaultRecord,
  defaultSettings,
  loadSettings,
  loadStore,
  saveSettings,
  saveStore,
  clearAllData,
  todayStr,
  updateRecord,
} from "./store";

interface AppContextValue {
  store: AppStore;
  today: string;
  getRecord: (date: string) => DailyRecord;
  patchRecord: (date: string, patch: Partial<DailyRecord>) => Promise<void>;
  refreshStore: () => Promise<void>;
  settings: AppSettings;
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStore>({ records: {} });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const today = todayStr();

  const refreshStore = useCallback(async () => {
    const s = await loadStore();
    setStore(s);
  }, []);

  useEffect(() => {
    refreshStore();
    loadSettings().then(setSettings);
  }, [refreshStore]);

  const getRecord = useCallback(
    (date: string): DailyRecord => store.records[date] ?? defaultRecord(date),
    [store]
  );

  const patchRecord = useCallback(
    async (date: string, patch: Partial<DailyRecord>) => {
      const newStore = await updateRecord(date, patch);
      setStore({ ...newStore });
    },
    []
  );

  const patchSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = { ...settings, ...patch };
      await saveSettings(updated);
      setSettings(updated);
    },
    [settings]
  );

  const resetAllData = useCallback(async () => {
    await clearAllData();
    setStore({ records: {} });
    setSettings(defaultSettings());
  }, []);

  return (
    <AppContext.Provider
      value={{ store, today, getRecord, patchRecord, refreshStore, settings, patchSettings, resetAllData }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
