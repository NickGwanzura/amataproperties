import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Shared mock functions — hoisted above vi.mock() calls for correct hoisting
// ---------------------------------------------------------------------------
const {
  mockRevalidatePath,
  mockFindFirst,
  mockAgentProfileFindFirst,
  mockInsert,
  mockInsertValues,
  mockReturning,
  mockUpdate,
  mockSet,
  mockTxSelect,
  mockCreateCommission,
  mockSendNotification,
  mockAuditLog,
  mockSessionUser,
} = vi.hoisted(() => {
  const fnRevalidatePath = vi.fn();
  const fnFindFirst = vi.fn();
  const fnAgentProfileFindFirst = vi.fn();
  const fnReturning = vi.fn();
  const fnInsertValues = vi.fn(() => ({ returning: fnReturning }));
  const fnInsert = vi.fn(() => ({ values: fnInsertValues }));
  const fnWhere = vi.fn().mockResolvedValue(undefined);
  const fnSet = vi.fn(() => ({ where: fnWhere }));
  const fnUpdate = vi.fn(() => ({ set: fnSet }));
  const fnTxLimit = vi.fn().mockResolvedValue([{ id: "client-user-1" }]);
  const fnTxWhere = vi.fn(() => ({ limit: fnTxLimit }));
  const fnTxSelect = vi.fn(() => ({ from: vi.fn(() => ({ where: fnTxWhere })) }));
  const fnCreateCommission = vi.fn().mockResolvedValue({ id: "comm-1" });
  const fnSendNotification = vi.fn().mockResolvedValue(undefined);
  const fnAuditLog = vi.fn().mockResolvedValue(undefined);
  const fnSessionUser = vi.fn().mockResolvedValue({ id: "session-user-1", name: "Test User", email: "test@example.com", role: "ACCOUNTS" });

  return {
    mockRevalidatePath: fnRevalidatePath,
    mockFindFirst: fnFindFirst,
    mockAgentProfileFindFirst: fnAgentProfileFindFirst,
    mockInsert: fnInsert,
    mockInsertValues: fnInsertValues,
    mockReturning: fnReturning,
    mockUpdate: fnUpdate,
    mockSet: fnSet,
    mockTxSelect: fnTxSelect,
    mockCreateCommission: fnCreateCommission,
    mockSendNotification: fnSendNotification,
    mockAuditLog: fnAuditLog,
    mockSessionUser: fnSessionUser,
  };
});

// ---------------------------------------------------------------------------
// Module mocks — use the hoisted fns above
// ---------------------------------------------------------------------------
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

vi.mock("@/lib/db/index", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ name: "Existing User", email: "existing@example.com", role: "CLIENT" }]),
      })),
    })),
    query: {
      reservations: {
        findFirst: mockFindFirst,
      },
      agentProfiles: {
        findFirst: mockAgentProfileFindFirst,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    transaction: vi.fn((cb: (tx: { insert: typeof mockInsert; update: typeof mockUpdate; select: typeof mockTxSelect }) => Promise<unknown>) => cb({
      insert: mockInsert,
      update: mockUpdate,
      select: mockTxSelect,
    })),
  },
  __esModule: true,
}));

vi.mock("@/lib/db/schema", () => {
  const tables = {
    payments: "payments",
    sales: "sales",
    installmentPlans: "installment_plans",
    installments: "installments",
    commissions: "commissions",
    documents: "documents",
    stands: "stands",
    reservations: "reservations",
    developments: "developments",
    users: { id: "users.id", name: "users", email: "users.email", role: "users.role" },
    accounts: { userId: "accounts.user_id" },
    clients: { id: "clients.id" },
    verifications: "verifications",
    leads: "leads",
    agentProfiles: "agent_profiles",
  };
  return { ...tables, __esModule: true };
});

vi.mock("@/lib/notifications", () => ({
  sendNotification: mockSendNotification,
}));

vi.mock("@/lib/audit", () => ({
  auditLog: mockAuditLog,
}));

vi.mock("@/lib/db/queries/commissions", () => ({
  createCommission: mockCreateCommission,
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: mockSessionUser,
}));

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are set up
// ---------------------------------------------------------------------------
import { convertReservationToSale, rejectReservation, updateUserRole } from "./actions";
import * as schema from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
type ReservationWithRelations = {
  id: string;
  reference: string;
  clientId: string;
  agentId: string | null;
  developmentId: string;
  standId: string;
  status: string;
  message: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; name: string; email: string };
  agent: {
    id: string;
    userId: string;
    commissionRate: string;
    user: { email: string; name: string };
  } | null;
  development: {
    id: string;
    name: string;
    depositAmount: string;
    interestRate: string;
    paymentDurationMonths: number;
  };
  stand: { id: string; standNumber: string; sizeSqm: number; price: string };
};

function makeFullReservation(status: string): ReservationWithRelations {
  return {
    id: "res-1",
    reference: "PRE-2026-BW-0041",
    clientId: "client-1",
    agentId: "agent-1",
    developmentId: "dev-1",
    standId: "stand-1",
    status,
    message: null,
    expiresAt: new Date(Date.now() + 14 * 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: "client-1", name: "Nyasha Dube", email: "nyasha@example.com" },
    agent: {
      id: "agent-1",
      userId: "user-1",
      commissionRate: "500",
      user: { email: "agent@example.com", name: "Tariro Moyo" },
    },
    development: {
      id: "dev-1",
      name: "Northgate Estate",
      depositAmount: "7500",
      interestRate: "6",
      paymentDurationMonths: 24,
    },
    stand: { id: "stand-1", standNumber: "NG-003", sizeSqm: 600, price: "30500" },
  };
}

function makeReservationWithoutAgent(status: string): ReservationWithRelations {
  const r = makeFullReservation(status);
  return { ...r, agentId: null, agent: null };
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  // Default returning chain:
  //   1st .returning() call → sale creation → [{ id: "sale-1" }]
  //   2nd .returning() call → installment plan → [{ id: "plan-1" }]
  mockReturning
    .mockResolvedValueOnce([{ id: "sale-1" }])
    .mockResolvedValueOnce([{ id: "plan-1" }]);
});

// ---------------------------------------------------------------------------
// convertReservationToSale tests
// ---------------------------------------------------------------------------
describe("convertReservationToSale", () => {
  it("converts an AWAITING_DEPOSIT reservation to a sale with agent commission", async () => {
    mockFindFirst.mockResolvedValue(makeFullReservation("AWAITING_DEPOSIT"));

    await convertReservationToSale("res-1");

    // Reservation lookup
    expect(mockFindFirst).toHaveBeenCalledOnce();

    // Payment created with VERIFIED status and deposit amount
    expect(mockInsert).toHaveBeenCalledWith(schema.payments);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        amount: "7500",
        status: "VERIFIED",
        method: "BANK_TRANSFER",
        type: "DEPOSIT",
        verifiedByUserId: "session-user-1",
      })
    );

    // Sale created
    expect(mockInsert).toHaveBeenCalledWith(schema.sales);

    // Installment plan created with principal = price - deposit
    expect(mockInsert).toHaveBeenCalledWith(schema.installmentPlans);
    // principal = 30500 - 7500 = 23000
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        principal: "23000",
        months: 24,
      })
    );

    // Installments created (24 monthly rows)
    expect(mockInsert).toHaveBeenCalledWith(schema.installments);
    expect(mockInsertValues).toHaveBeenCalled();

    // Reservation updated to APPROVED
    expect(mockUpdate).toHaveBeenCalledWith(schema.reservations);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPROVED" })
    );

    // Stand marked SOLD
    expect(mockUpdate).toHaveBeenCalledWith(schema.stands);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SOLD" })
    );

    // Commission created (agent exists)
    expect(mockCreateCommission).toHaveBeenCalledWith("sale-1", "agent-1", "500");

    // Documents created (SALE_AGREEMENT, RECEIPT, STATEMENT) — batched in one .values() call
    expect(mockInsert).toHaveBeenCalledWith(schema.documents);
    // Total .values() calls: payments, sales, plan, installments, documents, password token = 6
    expect(mockInsertValues).toHaveBeenCalledTimes(6);

    // Notifications sent to client (deposit + allocation), agent, and admin = 4 total
    expect(mockSendNotification).toHaveBeenCalledTimes(4);

    // Audit log written
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONVERT_TO_SALE",
        module: "ACCOUNTS",
      })
    );

    // Paths revalidated
    expect(mockRevalidatePath).toHaveBeenCalledWith("/accounts");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/agent");
  });

  it("handles PRESALE status (alternative valid initial state)", async () => {
    mockFindFirst.mockResolvedValue(makeFullReservation("PRESALE"));

    await convertReservationToSale("res-1");

    // Should proceed past the guard check and create data
    expect(mockInsert).toHaveBeenCalledWith(schema.payments);
    expect(mockInsert).toHaveBeenCalledWith(schema.sales);
    expect(mockCreateCommission).toHaveBeenCalled();
  });

  it("converts without an agent (no commission, single notification)", async () => {
    mockFindFirst.mockResolvedValue(makeReservationWithoutAgent("AWAITING_DEPOSIT"));

    await convertReservationToSale("res-1");

    // Commission should NOT be created
    expect(mockCreateCommission).not.toHaveBeenCalled();

    // Two notifications to client (deposit received + stand allocated), plus admin alert, no agent
    expect(mockSendNotification).toHaveBeenCalledTimes(3);

    // Core records still created
    expect(mockInsert).toHaveBeenCalledWith(schema.payments);
    expect(mockInsert).toHaveBeenCalledWith(schema.sales);
    expect(mockInsert).toHaveBeenCalledWith(schema.installmentPlans);
    expect(mockUpdate).toHaveBeenCalledWith(schema.reservations);
    expect(mockUpdate).toHaveBeenCalledWith(schema.stands);
  });

  it("returns early when reservation is not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    await convertReservationToSale("nonexistent");

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreateCommission).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns early for invalid statuses (PENDING, APPROVED, CANCELLED, EXPIRED)", async () => {
    const invalidStatuses = ["PENDING", "APPROVED", "CANCELLED", "EXPIRED"];

    for (const status of invalidStatuses) {
      vi.clearAllMocks();
      mockReturning
        .mockResolvedValueOnce([{ id: "sale-1" }])
        .mockResolvedValueOnce([{ id: "plan-1" }]);
      mockFindFirst.mockResolvedValue(makeFullReservation(status));

      await convertReservationToSale("res-1");

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    }
  });
});

// ---------------------------------------------------------------------------
// rejectReservation tests
// ---------------------------------------------------------------------------
describe("rejectReservation", () => {
  it("rejects an AWAITING_DEPOSIT reservation and releases the stand", async () => {
    mockFindFirst.mockResolvedValue(makeFullReservation("AWAITING_DEPOSIT"));

    await rejectReservation("res-1");

    // Reservation → CANCELLED
    expect(mockUpdate).toHaveBeenCalledWith(schema.reservations);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CANCELLED" })
    );

    // Stand → AVAILABLE
    expect(mockUpdate).toHaveBeenCalledWith(schema.stands);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "AVAILABLE" })
    );

    // Lead → LOST (filtered by clientId + developmentId + PRESALE_INITIATED status)
    expect(mockUpdate).toHaveBeenCalledWith(schema.leads);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "LOST" })
    );

    // Audit log
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REJECT_RESERVATION",
        module: "ACCOUNTS",
      })
    );

    // Path revalidated
    expect(mockRevalidatePath).toHaveBeenCalledWith("/accounts");
  });

  it("handles PRESALE status (alternative valid initial state)", async () => {
    mockFindFirst.mockResolvedValue(makeFullReservation("PRESALE"));

    await rejectReservation("res-1");

    expect(mockUpdate).toHaveBeenCalledWith(schema.reservations);
    expect(mockUpdate).toHaveBeenCalledWith(schema.stands);
    expect(mockUpdate).toHaveBeenCalledWith(schema.leads);
  });

  it("returns early when reservation is not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    await rejectReservation("nonexistent");

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns early for invalid statuses", async () => {
    const invalidStatuses = ["PENDING", "APPROVED", "CANCELLED", "EXPIRED"];

    for (const status of invalidStatuses) {
      vi.clearAllMocks();
      mockReturning
        .mockResolvedValueOnce([{ id: "sale-1" }])
        .mockResolvedValueOnce([{ id: "plan-1" }]);
      mockFindFirst.mockResolvedValue(makeFullReservation(status));

      await rejectReservation("res-1");

      expect(mockUpdate).not.toHaveBeenCalled();
    }
  });
});

// ---------------------------------------------------------------------------
// updateUserRole / agent profile creation tests
// ---------------------------------------------------------------------------
describe("updateUserRole — agent profile creation", () => {
  beforeEach(() => {
    // Use an admin session for these tests
    mockSessionUser.mockResolvedValue({ id: "admin-user-1", name: "Admin", email: "admin@example.com", role: "ADMINISTRATOR" });
  });

  it("creates an agent profile when role is set to AGENT and none exists", async () => {
    mockAgentProfileFindFirst.mockResolvedValue(null); // no existing profile

    await updateUserRole("user-42", "AGENT");

    // Should check for an existing profile
    expect(mockAgentProfileFindFirst).toHaveBeenCalledOnce();

    // Should insert a new active profile for the user
    expect(mockInsert).toHaveBeenCalledWith(schema.agentProfiles);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-42", active: true })
    );

    // Audit log written
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE_USER_ROLE",
        module: "ADMIN",
      })
    );

    // Should revalidate admin paths
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("skips profile creation when agent profile already exists", async () => {
    mockAgentProfileFindFirst.mockResolvedValue({ id: "existing-profile", userId: "user-42", active: true });

    await updateUserRole("user-42", "AGENT");

    expect(mockAgentProfileFindFirst).toHaveBeenCalledOnce();
    // No insert should have happened for agentProfiles
    const agentProfileInsertCall = (mockInsert.mock.calls as unknown[][]).find(
      (args) => args[0] === schema.agentProfiles
    );
    expect(agentProfileInsertCall).toBeUndefined();

    // Audit log still written
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE_USER_ROLE",
        module: "ADMIN",
      })
    );
  });

  it("does not create an agent profile for non-AGENT roles", async () => {
    for (const role of ["CLIENT", "ACCOUNTS", "ADMINISTRATOR", "CEO", "PUBLIC"]) {
      vi.clearAllMocks();
      mockSessionUser.mockResolvedValue({ id: "admin-user-1", name: "Admin", email: "admin@example.com", role: "ADMINISTRATOR" });

      await updateUserRole("user-42", role);

      expect(mockAgentProfileFindFirst).not.toHaveBeenCalled();
      const agentProfileInsertCall = (mockInsert.mock.calls as unknown[][]).find(
        (args) => args[0] === schema.agentProfiles
      );
      expect(agentProfileInsertCall).toBeUndefined();

      // Audit log written for every role change
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE_USER_ROLE",
          module: "ADMIN",
        })
      );
    }
  });
});
