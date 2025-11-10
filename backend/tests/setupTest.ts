import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
// 🔧 Carrega variáveis de ambiente do .env.test
dotenv.config({ path: ".env.test" });

// Instância local do PrismaClient
const prisma = new PrismaClient();

export async function setupTestDB() {
    // 1. Cria um sufixo único para o email do ADMIN, evitando colisões de concorrência.
    const UNIQUE_SUFFIX = Date.now();
    const ADMIN_EMAIL = `admin_test_${UNIQUE_SUFFIX}@example.com`;
    
    try {
        // 🔹 Limpa todos os usuários antes de criar novos
        await prisma.user.deleteMany({});

        // 🔒 Garantia de que JWT_SECRET está disponível
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "[TEST ERROR] JWT_SECRET não definido. Verifique seu arquivo .env.test"
            );
        }

        // Cria usuário ADMIN
        const adminPassword = "fodaodoidao";
        const adminHashed = await bcrypt.hash(adminPassword, 12);

        // A remoção específica abaixo foi excluída, pois o deleteMany({}) acima já limpa tudo.

        const adminUser = await prisma.user.create({
            data: {
                Email: ADMIN_EMAIL, // << Usando o email dinâmico para garantir unicidade
                PasswordHash: adminHashed,
                name: "Admin Teste",
                Role: "ADMIN",
            },
        });

        // Gera token JWT real para o admin
        const adminToken = jwt.sign(
            {
                userId: adminUser.IDUser,
                role: adminUser.Role,
                email: adminUser.Email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Cria usuário STUDENT (mantido com Date.now() para unicidade)
        const testPassword = "12345678";
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        const testUser = await prisma.user.create({
            data: {
                Email: `teste_student_${Date.now()}@example.com`,
                PasswordHash: hashedPassword,
                name: "Usuário Teste",
                Role: "STUDENT",
            },
        });

        return {
            adminUser,
            adminToken,
            adminPassword,
            testUser,
            testUserPassword: testPassword,
        };
    } finally {
        await prisma.$disconnect();
    }
}