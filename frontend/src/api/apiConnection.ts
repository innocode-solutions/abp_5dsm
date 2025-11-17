import axios from "axios"
import { API_URL } from "../config/api"

export const apiConnection = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})  