import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadStore, saveStore, updateRecord, defaultRecord } from "../lib/store";

const mockedGetItem = AsyncStorage.getItem as ReturnType<typeof vi.fn>;
const mockedSetItem = AsyncStorage.setItem as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadStore", () => {
  it("returns default store when no data exists", async () => {
    mockedGetItem.mockResolvedValue(null);
    const store = await loadStore();
    expect(store).toEqual({ records: {}, badges: [] });
  });

  it("returns parsed store when data exists", async () => {
    const data = {
      records: {
        "2026-03-01": { ...defaultRecord("2026-03-01"), status: "kyukan", actualDrinks: 0 },
      },
      badges: ["first_kyukan"],
    };
    mockedGetItem.mockResolvedValue(JSON.stringify(data));
    const store = await loadStore();
    expect(store.badges).toEqual(["first_kyukan"]);
    expect(store.records["2026-03-01"].status).toBe("kyukan");
  });
});

describe("saveStore", () => {
  it("calls setItem with correct key", async () => {
    mockedSetItem.mockResolvedValue(undefined);
    const store = { records: {}, badges: [] };
    await saveStore(store);
    expect(mockedSetItem).toHaveBeenCalledWith(
      "kyukoubi_store_v1",
      JSON.stringify(store)
    );
  });
});

describe("updateRecord", () => {
  it("merges patch into existing record", async () => {
    const existingStore = {
      records: {
        "2026-03-01": { ...defaultRecord("2026-03-01"), status: "ok" as const, actualDrinks: 2 },
      },
      badges: [],
    };
    mockedGetItem.mockResolvedValue(JSON.stringify(existingStore));
    mockedSetItem.mockResolvedValue(undefined);

    const result = await updateRecord("2026-03-01", { actualDrinks: 5 });
    expect(result.records["2026-03-01"].actualDrinks).toBe(5);
    // status should remain from existing record
    expect(result.records["2026-03-01"].status).toBe("ok");
  });
});
