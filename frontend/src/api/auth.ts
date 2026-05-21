import { client } from "./client";
import type { AuthResponse, LoginPayload, User } from "../types";

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>("/auth/login", payload);
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await client.get<User>("/auth/me");
    return data;
  },
};
