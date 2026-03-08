import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AppStore,
  DailyRecord,
  defaultRecord,
  loadStore,
  saveStore,
  todayStr,
  updateRecord,
} from "./store";

interface AppContextValue {
  store: AppStore;
  today: string;
  getRecord: (date: string) => DailyRecord;
  patchRecord: (date: string, patch: Partial<DailyRecord>) => Promise<void>;
  refreshStore: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStore>({ records: {} });
  const today = todayStr();

  const refreshStore = useCallback(async () => {
    const s = await loadStore();
    setStore(s);
  }, []);

  useEffect(() => {
    refreshStore();
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

  return (
    <AppContext.Provider value={{ store, today, getRecord, patchRecord, refreshStore }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
