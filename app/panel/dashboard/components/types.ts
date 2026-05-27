export interface Companion {
  id: string; name: string; photo_url: string; status: string; email: string;
  age: number | null; location: string | null; personality_type: string | null;
  tagline: string | null; description: string | null; stripe_account_id: string | null;
}

export interface VaultItem {
  id: string; type: string; title: string | null; price: number;
  file_url: string | null; thumbnail_url: string | null; group_name: string | null;
}

export interface Stats {
  totalSales: number; totalRevenue: number; uniqueClients: number;
  totalItems: number; weekRevenue: number;
  monthGrowth?: number;
  weekDaily?: number[];
  referralBonus?: number;
  referralUsers?: number;
}

export interface Sale {
  amount: number; created_at: string; title: string | null;
  first_name: string | null; username: string | null;
}

export interface BalanceData {
  earningsStars: number;
  pendingStars: number;
  availableStars: number;
  estimatedMxn: number;
  minWithdrawalStars: number;
  starsToMxn: number;
  mpEmail: string | null;
  clabe: string | null;
  isNewCreator?: boolean;
}

export const PERSONALITY_OPTIONS = [
  { value: 'romantica', label: 'Romántica' },
  { value: 'aventurera', label: 'Aventurera' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'divertida', label: 'Divertida' },
  { value: 'misteriosa', label: 'Misteriosa' },
  { value: 'coqueta', label: 'Coqueta' },
];

export const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n);
