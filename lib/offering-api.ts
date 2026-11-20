import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type Account = { id: string; name: string; purpose: string };
export type OfferingMember = { member_id: string; full_name: string; display_name: string; name_aliases: string[] };
export type TransactionCategory = "offering" | "other_income" | "expense";
export type OfferingTransaction = {
  id: string; account_id: string; transaction_date: string; transaction_time: string;
  description: string; details: string; withdrawal: number; deposit: number;
  category: TransactionCategory; member_id: string | null; purpose: string;
};
export type NewOfferingTransaction = Omit<OfferingTransaction, "id">;

async function allRows<T>(table: string, columns: string): Promise<T[]> {
  const client = createSupabaseBrowserClient();
  const result: T[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await client.from(table).select(columns).order(table === "members" ? "member_id" : "id").range(start, start + 999);
    if (error) throw error;
    result.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < 1000) return result;
  }
}

export const offeringApi = {
  accounts: () => allRows<Account>("offering_accounts", "id,name,purpose"),
  members: () => allRows<OfferingMember>("members", "member_id,full_name,display_name,name_aliases"),
  transactions: () => allRows<OfferingTransaction>("offering_transactions", "id,account_id,transaction_date,transaction_time,description,details,withdrawal,deposit,category,member_id,purpose"),
  async createAccount(name: string, purpose: string) {
    const { error } = await createSupabaseBrowserClient().from("offering_accounts").insert({ name, purpose });
    if (error) throw error;
  },
  async updateAccount(id: string, name: string, purpose: string) {
    const { error } = await createSupabaseBrowserClient().from("offering_accounts").update({ name, purpose }).eq("id", id);
    if (error) throw error;
  },
  async saveTransactions(rows: NewOfferingTransaction[]) {
    const { error } = await createSupabaseBrowserClient().from("offering_transactions").insert(rows);
    if (error) throw error;
  },
  async updateTransaction(id: string, category: TransactionCategory, member_id: string | null, purpose: string) {
    const { error } = await createSupabaseBrowserClient().from("offering_transactions").update({ category, member_id, purpose }).eq("id", id);
    if (error) throw error;
  },
};
