import React, { createContext, useContext, useState } from 'react';
import { HabitService, HabitData } from '../service/HabitService';

interface HabitContextProps {
  submitHabits: (data: HabitData) => Promise<void>;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const HabitContext = createContext<HabitContextProps>({} as HabitContextProps);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitHabits = async (data: HabitData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await HabitService.submitHabits(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar hábitos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HabitContext.Provider value={{ submitHabits, loading, success, error }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabit = () => useContext(HabitContext);