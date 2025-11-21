import { apiConnection } from '../api/apiConnection';

export interface Course {
    IDCurso: string;
    NomeDoCurso: string;
    Descricao?: string;
    _count?: {
        disciplinas: number;
        alunos: number;
    };
}

export interface CourseResponse {
    data: Course[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const courseService = {
    getAll: async (page = 1, limit = 10, search = ''): Promise<CourseResponse> => {
        const response = await apiConnection.get<CourseResponse>('/cursos', {
            params: { page, limit, search },
        });
        return response.data;
    },

    getById: async (id: string): Promise<Course> => {
        const response = await apiConnection.get<Course>(`/cursos/${id}`);
        return response.data;
    },

    create: async (data: { NomeDoCurso: string; Descricao?: string }): Promise<Course> => {
        const response = await apiConnection.post<Course>('/cursos', data);
        return response.data;
    },

    update: async (id: string, data: { NomeDoCurso: string; Descricao?: string }): Promise<Course> => {
        const response = await apiConnection.put<Course>(`/cursos/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiConnection.delete(`/cursos/${id}`);
    },
};
