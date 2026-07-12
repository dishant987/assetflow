import { sql } from "drizzle-orm";
import { db } from "../config/db";

export async function nextAssetTag(): Promise<string> {
  const result = await db.execute(sql`SELECT nextval('asset_tag_seq') AS seq`);
  const seq = Number((result as unknown as { rows: { seq: number }[] }).rows[0].seq);
  return `AF-${String(seq).padStart(4, "0")}`;
}
