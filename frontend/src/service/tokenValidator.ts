import { jwtDecode } from "jwt-decode";
import { getToken } from "./tokenStore";

interface TokenPayload {
  exp: number;
  userId: string;
  Email: string;
}

export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}

export async function getTokenPayload(): Promise<TokenPayload | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    return null;
  }
}
