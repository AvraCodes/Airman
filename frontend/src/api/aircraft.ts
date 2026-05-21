import { client } from "./client";
import type { Aircraft } from "../types";

export const aircraftApi = {
  list: async (): Promise<Aircraft[]> => {
    const { data } = await client.get<Aircraft[]>("/aircraft");
    return data;
  },
  get: async (id: number): Promise<Aircraft> => {
    const { data } = await client.get<Aircraft>(`/aircraft/${id}`);
    return data;
  },
  ground: async (id: number): Promise<Aircraft> => {
    const { data } = await client.patch<Aircraft>(`/aircraft/${id}/ground`);
    return data;
  },
  ready: async (id: number): Promise<Aircraft> => {
    const { data } = await client.patch<Aircraft>(`/aircraft/${id}/ready`);
    return data;
  },
  maintenance: async (id: number): Promise<Aircraft> => {
    const { data } = await client.patch<Aircraft>(`/aircraft/${id}/maintenance`);
    return data;
  },
  readinessSummary: async (): Promise<Record<string, number>> => {
    const { data } = await client.get<Record<string, number>>("/aircraft/readiness");
    return data;
  },
};

