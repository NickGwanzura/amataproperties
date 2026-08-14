import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockInsert,
  mockInsertValues,
  mockReturning,
  mockUpdate,
  mockDbSelect,
  mockTxSelect,
  mockCreateCommission,
  mockSendNotification,
  mockAuditLog,
} = vi.hoisted(() => {
  const fnReturning = vi.fn();
  const fnInsertValues = vi.fn(() => ({ returning: fnReturning }));
  const fnInsert = vi.fn(() => ({ values: fnInsertValues }));
  const fnWhere = vi.fn().mockResolvedValue(undefined);
  const fnSet = vi.fn(() => ({ where: fnWhere }));
  const fnUpdate = vi.fn(() => ({ set: fnSet }));
  const fnDbWhere = vi.fn().mockResolvedValue([{ name: "Accounts", email: "accounts@amataproperties.com" }]);
  const fnDbSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: fnDbWhere })) }));
  const fnTxLimit = vi.fn().mockResolvedValue([{ id: "client-user-1" }]);
  const fnTxWhere = vi.fn(() => ({ limit: fnTxLimit }));
  const fnTxSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: fnTxWhere })) }));
  const fnCreateCommission = vi.fn().mockResolvedValue({ id: "comm-1" });
  const fnSendNotification = vi.fn().mockResolvedValue(undefined);
  const fnAuditLog = vi.fn().mockResolvedValue(undefined);

  return {
    mockInsert: fnInsert,
    mockInsertValues: fnInsertValues,
    mockReturning: fnReturning,
    mockUpdate: fnUpdate,
    mockSet: fnSet,
    mockWhere: fnWhere,
    mockDbSelect: fnDbSelect,
    mockTxSelect: fnTxSelect,
    mockCreateCommission: fnCreateCommission,
    mockSendNotification: fnSendNotification,
    mockAuditLog: fnAuditLog,
  };
});

vi.mock("@/lib/db/index", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: mockDbSelect,
    transaction: vi.fn((cb: (tx: { insert: typeof mockInsert; update: typeof mockUpdate; select: typeof mockTxSelect }) => Promise<unknown>) =>
      cb({ insert: mockInsert, update: mockUpdate, select: mockTxSelect })
    ),
  },
  __esModule: true,
}));

vi.mock("@/lib/db/schema", () => ({
  payments: "payments",
  sales: "sales",
  installmentPlans: "installment_plans",
  installments: "installments",
  documents: "documents",
  stands: "stands",
  reservations: "reservations",
  users: { id: "users.id", name: "users.name", email: "users.email", role: "users.role" },
  accounts: { userId: "accounts.user_id" },
  clients: { id: "clients.id" },
  verifications: "verifications",
  __esModule: true,
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  inArray: vi.fn((col: unknown, values: unknown[]) => ({ col, values })),
}));

vi.mock("@/lib/db/queries/commissions", () => ({
  createCommission: mockCreateCommission,
}));

vi.mock("@/lib/notifications", () => ({
  sendNotification: mockSendNotification,
}));

vi.mock("@/lib/audit", () => ({
  auditLog: mockAuditLog,
}));

vi.mock("@/lib/email-templates", () => ({
  depositPaidEmail: vi.fn(() => "<html>deposit</html>"),
  allocationEmail: vi.fn(() => "<html>allocation</html>"),
  adminSaleAlertEmail: vi.fn(() => "<html>admin</html>"),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { buildSaleFromReservation } from "./sale-conversion";
import type { SaleInput } from "./sale-conversion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeInput(overrides: Partial<SaleInput> = {}): SaleInput {
  return {
    reservationId: "res-1",
    clientId: "client-1",
    clientEmail: "nyasha@example.com",
    clientName: "Nyasha Dube",
    agentId: "agent-1",
    agentEmail: "agent@example.com",
    commissionRate: "500",
    developmentId: "dev-1",
    developmentName: "Northgate Estate",
    developmentDeposit: 7500,
    developmentInterest: "6",
    standId: "stand-1",
    standNumber: "NG-003",
    standSizeSqm: 600,
    reference: "PRE-2026-TEST",
    purchasePrice: 30500,
    depositAmount: 7500,
    depositMethod: "BANK_TRANSFER",
    depositReference: "DEP-PRE-2026-TEST",
    depositNotes: undefined,
    months: 24,
    verifiedByUserId: "accounts-user-1",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // 1st returning → sale creation → [{ id: "sale-1" }]
  // 2nd returning → installment plan → [{ id: "plan-1" }]
  mockReturning
    .mockResolvedValueOnce([{ id: "sale-1" }])
    .mockResolvedValueOnce([{ id: "plan-1" }]);
});

// ---------------------------------------------------------------------------
// Commission creation tests
// ---------------------------------------------------------------------------
describe("buildSaleFromReservation — commission creation", () => {
  it("creates a commission with the agent id and rate when agentId is set", async () => {
    const result = await buildSaleFromReservation(makeInput({ agentId: "agent-42", commissionRate: "750" }));

    expect(mockCreateCommission).toHaveBeenCalledOnce();
    expect(mockCreateCommission).toHaveBeenCalledWith("sale-1", "agent-42", "750");
    expect(result.saleId).toBe("sale-1");
    expect(result.planId).toBe("plan-1");
  });

  it("uses the commission rate as provided (no normalisation)", async () => {
    await buildSaleFromReservation(makeInput({ commissionRate: "1200" }));
    expect(mockCreateCommission).toHaveBeenCalledWith("sale-1", "agent-1", "1200");
  });

  it("skips commission creation when agentId is null", async () => {
    await buildSaleFromReservation(makeInput({ agentId: null, agentEmail: null }));
    expect(mockCreateCommission).not.toHaveBeenCalled();
  });

  it("still sends client notifications even without an agent", async () => {
    await buildSaleFromReservation(makeInput({ agentId: null, agentEmail: null }));
    // deposit received + stand allocated + admin alert (no agent notification)
    expect(mockSendNotification).toHaveBeenCalledTimes(3);
  });

  it("sends agent notification when agentEmail is set", async () => {
    await buildSaleFromReservation(makeInput({ agentEmail: "agent@example.com" }));
    const agentCall = mockSendNotification.mock.calls.find(
      (args: unknown[]) => (args[0] as { recipient: string }).recipient === "agent@example.com"
    );
    expect(agentCall).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Deposit clamping tests
// ---------------------------------------------------------------------------
describe("buildSaleFromReservation — deposit amount", () => {
  it("clamps deposit to purchase price when depositAmount exceeds price", async () => {
    await buildSaleFromReservation(makeInput({ purchasePrice: 5000, depositAmount: 9999 }));

    const paymentInsert = mockInsertValues.mock.calls.find(
      (args: unknown[]) => (args[0] as { type?: string }).type === "DEPOSIT"
    );
    expect(paymentInsert).toBeDefined();
    expect(((paymentInsert as unknown[])[0] as { amount: string }).amount).toBe("5000");
  });

  it("records the correct outstanding balance after clamping", async () => {
    // purchasePrice=10000, depositAmount=6000 → outstanding=4000, months=10 → monthly=400
    await buildSaleFromReservation(makeInput({ purchasePrice: 10000, depositAmount: 6000, months: 10 }));

    const planInsert = mockInsertValues.mock.calls.find(
      (args: unknown[]) => (args[0] as { principal?: string }).principal !== undefined
    );
    expect(((planInsert as unknown[])[0] as { principal: string }).principal).toBe("4000");
    expect(((planInsert as unknown[])[0] as { monthlyAmount: string }).monthlyAmount).toBe("400");
  });
});

// ---------------------------------------------------------------------------
// Return value tests
// ---------------------------------------------------------------------------
describe("buildSaleFromReservation — return value", () => {
  it("returns saleId, saleNumber, and planId", async () => {
    const result = await buildSaleFromReservation(makeInput());

    expect(result.saleId).toBe("sale-1");
    expect(result.planId).toBe("plan-1");
    expect(result.saleNumber).toMatch(/^SALE-\d{4}-[A-Z0-9]+$/);
  });

  it("writes an audit log with CONVERT_TO_SALE action", async () => {
    await buildSaleFromReservation(makeInput());

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONVERT_TO_SALE",
        module: "ACCOUNTS",
      })
    );
  });
});
