// src/services/HabitService.ts (CORRIGIDO)

import axios from 'axios';
import { getToken } from '../service/tokenStore';
import { API_URL } from '../api/apiConnection';

// No arquivo src/service/HabitService.ts (ou onde sua interface HabitData está definida)

export interface HabitData {
    // Campos básicos
    sono: number;
    horasEstudo: number;
    motivacao: number;
    frequencia: number;
    
    // Campos adicionais para desempenho
    // Previous_Scores removido para evitar viés - não é mais necessário
    Distance_from_Home?: string;
    Gender?: string;
    Parental_Education_Level?: string;
    Parental_Involvement?: string;
    School_Type?: string;
    Peer_Influence?: string;
    Extracurricular_Activities?: string;
    Learning_Disabilities?: string;
    Internet_Access?: string;
    Access_to_Resources?: string;
    Teacher_Quality?: string;
    Family_Income?: string;
    Motivation_Level?: string;
    Tutoring_Sessions?: string;
    Physical_Activity?: string;
    
    // Campos retornados pelo backend
    IDHabito?: string;
    IDAluno?: string;
    createdAt?: string;
    updatedAt?: string;
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