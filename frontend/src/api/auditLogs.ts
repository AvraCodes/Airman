import { client } from "./client";
import type { AuditLog } from "../types";

export const auditApi = {
  list: async (params?: {
    entity_type?: string;
    entity_id?: number;
    actor_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> => {
    const { data } = await client.get<AuditLog[]>("/audit-logs", { params });
    return data;
  },
};
