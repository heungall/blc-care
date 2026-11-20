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
export type OfferingImportBatch = { id: string; account_id: string; created_by: string; created_at: string; transaction_count: number; first_date: string; last_date: string; deleted_at: string | null; deleted_by: string | null };
export type OfferingUser = { user_id: string; name: string };

async function allRows<T>(table: string, columns: string): Promise<T[]> {
  const client = createSupabaseBrowserClient();
  const result: T[] = [];
  for (let start = 0; ; start += 1000) {
    const orderBy = table === "members" ? "member_id" : table === "users" ? "user_id" : "id";
    const { data, error } = await client.from(table).select(columns).order(orderBy).range(start, start + 999);
    if (error) throw error;
    result.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < 1000) return result;
  }
}

export const offeringApi = {
  accounts: () => allRows<Account>("offering_accounts", "id,name,purpose"),
  members: () => allRows<OfferingMember>("members", "member_id,full_name,display_name,name_aliases"),
  users: () => allRows<OfferingUser>("users", "user_id,name"),
  batches: () => allRows<OfferingImportBatch>("offering_import_batches", "id,account_id,created_by,created_at,transaction_count,first_date,last_date,deleted_at,deleted_by"),
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
    if (!rows.length || rows.length > 500 || rows.some((row) => row.account_id !== rows[0].account_id)) throw new Error("계좌와 거래 건수를 확인해 주세요.");
    const { error } = await createSupabaseBrowserClient().rpc("save_offering_import", { p_account_id: rows[0]?.account_id, p_rows: rows });
    if (error) throw error;
  },
  async deleteBatch(id: string) {
    const { error } = await createSupabaseBrowserClient().rpc("delete_offering_import", { p_batch_id: id });
    if (error) throw error;
  },
  async updateTransaction(id: string, category: TransactionCategory, member_id: string | null, purpose: string) {
    const { error } = await createSupabaseBrowserClient().from("offering_transactions").update({ category, member_id, purpose }).eq("id", id);
    if (error) throw error;
  },
};
