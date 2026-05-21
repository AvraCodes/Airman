import { client } from "./client";
import type { TrainingProgress, TrainingProgressCreate } from "../types";

export const trainingApi = {
  getBySortie: async (sortieId: number): Promise<TrainingProgress[]> => {
    const { data } = await client.get<TrainingProgress[]>(`/training-progress/${sortieId}`);
    return data;
  },
  create: async (payload: TrainingProgressCreate): Promise<TrainingProgress> => {
    const { data } = await client.post<TrainingProgress>("/training-progress", payload);
    return data;
  },
  submit: async (id: number): Promise<TrainingProgress> => {
    const { data } = await client.patch<TrainingProgress>(`/training-progress/${id}/submit`);
    return data;
  },
  approve: async (id: number): Promise<TrainingProgress> => {
    const { data } = await client.patch<TrainingProgress>(`/training-progress/${id}/approve`);
    return data;
  },
  reject: async (id: number, remarks: string): Promise<TrainingProgress> => {
    const { data } = await client.patch<TrainingProgress>(`/training-progress/${id}/reject`, { remarks });
    return data;
  },
};
