// src/services/HabitService.ts (CORRIGIDO)

import axios from 'axios';
import { getToken } from '../service/tokenStore'; 

const API_URL = 'http://localhost:8080/api'; // Certifique-se de que esta URL está correta (use 10.0.2.2 se for emulador Android)

// No arquivo src/service/HabitService.ts (ou onde sua interface HabitData está definida)

export interface HabitData {
    // Campos que você envia/recebe:
    sono: number;
    horasEstudo: number;
    motivacao: number;
    frequencia: number;
    
    // Campos que o backend RETORNA (e causam o erro de tipagem):
    IDHabito?: string;  // Opcional, se você não envise, mas recebe
    IDAluno?: string;   // Opcional
    createdAt?: string; // Data formatada como string
    updatedAt?: string; // Data formatada como string
}

export const HabitService = {
 async submitHabits(data: HabitData) {
  try {
   const token = await getToken(); 
      
   // CORREÇÃO: Usa a rota /aluno-habitos (POST) sem ID na URL
   const response = await axios.post(`${API_URL}/aluno-habitos`, data, {
    headers: {
     Authorization: `Bearer ${token}`,
    },
   });
   return response.data;
  } catch (error: any) {
   throw error.response?.data || { message: 'Erro ao enviar hábitos.' };
  }
 },

 // Não precisa mais de IDAluno como parâmetro, pois o token o identifica
 async getHabits() { 
  try {
   const token = await getToken();
   // CORREÇÃO: Usa a rota /aluno-habitos (GET) sem ID na URL
   const response = await axios.get(`${API_URL}/aluno-habitos`, {
    headers: {
     Authorization: `Bearer ${token}`,
    },
   });
   return response.data;
  } catch (error: any) {
   throw error.response?.data || { message: 'Erro ao buscar hábitos.' };
  }
 },
};