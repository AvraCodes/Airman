import { client } from "./client";
import type { Sortie, SortieCreate } from "../types";

export const sortiesApi = {
  list: async (): Promise<Sortie[]> => {
    const { data } = await client.get<Sortie[]>("/sorties");
    return data;
  },
  get: async (id: number): Promise<Sortie> => {
    const { data } = await client.get<Sortie>(`/sorties/${id}`);
    return data;
  },
  create: async (payload: SortieCreate): Promise<Sortie> => {
    const { data } = await client.post<Sortie>("/sorties", payload);
    return data;
  },
  release:  async (id: number): Promise<Sortie> => { const { data } = await client.patch<Sortie>(`/sorties/${id}/release`);  return data; },
  airborne: async (id: number): Promise<Sortie> => { const { data } = await client.patch<Sortie>(`/sorties/${id}/airborne`); return data; },
  land:     async (id: number): Promise<Sortie> => { const { data } = await client.patch<Sortie>(`/sorties/${id}/landed`);   return data; },
  cancel:   async (id: number): Promise<Sortie> => { const { data } = await client.patch<Sortie>(`/sorties/${id}/cancel`);   return data; },
  close:    async (id: number): Promise<Sortie> => { const { data } = await client.patch<Sortie>(`/sorties/${id}/close`);    return data; },
};
