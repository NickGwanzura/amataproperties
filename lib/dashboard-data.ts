export const monthlyRevenue = [
  { month: "Jan", revenue: 0, collections: 0 },
  { month: "Feb", revenue: 0, collections: 0 },
  { month: "Mar", revenue: 0, collections: 0 },
  { month: "Apr", revenue: 0, collections: 0 },
  { month: "May", revenue: 0, collections: 0 },
  { month: "Jun", revenue: 0, collections: 0 },
];

export const agentRankings: {
  name: string;
  leads: number;
  sales: number;
  revenue: number;
  commission: number;
}[] = [];

export const aging = [
  { bucket: "Current", amount: 0 },
  { bucket: "30 Days", amount: 0 },
  { bucket: "60 Days", amount: 0 },
  { bucket: "90 Days", amount: 0 },
  { bucket: "120+ Days", amount: 0 },
];

export const executiveStats = {
  developments: 0,
  totalStands: 0,
  available: 0,
  reserved: 0,
  presales: 0,
  sold: 0,
  revenue: 0,
  outstanding: 0,
  collectionEfficiency: 0,
  commissionLiability: 0,
  depositsCollected: 0,
};
