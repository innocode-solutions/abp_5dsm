import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

/**
 * Script para criar um professor e associá-lo a todas as disciplinas
 * 
 * Uso:
 * 1. Cria um usuário professor (se não existir)
 * 2. Como não há tabela de associação professor-disciplina no schema atual,
 *    este script apenas cria o professor. Professores já podem ver todas as disciplinas
 *    através do endpoint getTeacherClasses.
 * 
 * Para executar: npx ts-node src/scripts/assignTeacherToAllDisciplines.ts
 */

async function assignTeacherToAllDisciplines() {
  try {
    const teacherEmail = process.env.TEACHER_EMAIL || 'professor@exemplo.com';
    const teacherPassword = process.env.TEACHER_PASSWORD || 'professor123';
    const teacherName = process.env.TEACHER_NAME || 'Professor Geral';

    console.log('🔍 Verificando se o professor já existe...');
    
    // Verificar se o professor já existe
    let teacher = await prisma.user.findUnique({
      where: { Email: teacherEmail },
    });

    if (teacher) {
      console.log('✅ Professor já existe:', teacherEmail);
      
      // Verificar se já é TEACHER
      if (teacher.Role !== 'TEACHER') {
        console.log('🔄 Atualizando role para TEACHER...');
        teacher = await prisma.user.update({
          where: { IDUser: teacher.IDUser },
          data: { Role: 'TEACHER' },
        });
        console.log('✅ Role atualizado para TEACHER');
      } else {
        console.log('✅ Professor já tem role TEACHER');
      }
    } else {
      console.log('📝 Criando novo professor...');
      
      // Hash da senha
      const passwordHash = await bcrypt.hash(teacherPassword, 10);
      
      // Criar professor
      teacher = await prisma.user.create({
        data: {
          Email: teacherEmail,
          PasswordHash: passwordHash,
          Role: 'TEACHER',
          name: teacherName,
        },
      });
      
      console.log('✅ Professor criado com sucesso!');
      console.log('   Email:', teacherEmail);
      console.log('   Senha:', teacherPassword);
      console.log('   ID:', teacher.IDUser);
    }

    // Buscar todas as disciplinas
    const disciplinas = await prisma.disciplina.findMany({
      where: { Ativa: true },
      select: {
        IDDisciplina: true,
        NomeDaDisciplina: true,
      },
    });

    console.log(`\n📚 Total de disciplinas encontradas: ${disciplinas.length}`);
    
    if (disciplinas.length > 0) {
      console.log('\n📋 Disciplinas disponíveis:');
      disciplinas.forEach((disc, index) => {
        console.log(`   ${index + 1}. ${disc.NomeDaDisciplina} (${disc.IDDisciplina})`);
      });
    }

    console.log('\n✅ Processo concluído!');
    console.log('\n💡 Nota: Professores podem acessar todas as disciplinas através do endpoint /alunos/students/class/:subjectId');
    console.log('   O professor criado pode fazer login e ver todas as turmas disponíveis.');

  } catch (error) {
    console.error('❌ Erro ao processar:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  assignTeacherToAllDisciplines()
    .then(() => {
      console.log('\n✨ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export default assignTeacherToAllDisciplines;

