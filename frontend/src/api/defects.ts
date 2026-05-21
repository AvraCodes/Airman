import { client } from "./client";
import type { Defect, DefectCreate } from "../types";

export const defectsApi = {
  list: async (): Promise<Defect[]> => {
    const { data } = await client.get<Defect[]>("/defects");
    return data;
  },
  get: async (id: number): Promise<Defect> => {
    const { data } = await client.get<Defect>(`/defects/${id}`);
    return data;
  },
  create: async (payload: DefectCreate): Promise<Defect> => {
    const { data } = await client.post<Defect>("/defects", payload);
    return data;
  },
  resolve: async (id: number, recovery_decision: string): Promise<Defect> => {
    const { data } = await client.patch<Defect>(`/defects/${id}/resolve`, { recovery_decision });
    return data;
  },
};
