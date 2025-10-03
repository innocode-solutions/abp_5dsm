# Academic Management API

A comprehensive REST API for managing academic institutions, built with Node.js, Express, TypeScript, and Prisma.

## Features

- **Complete CRUD Operations** for all entities:
  - Courses (Cursos)
  - Subjects (Disciplinas)
  - Students (Alunos)
  - Users (Users)
  - Academic Periods (Períodos Letivos)
  - Enrollments (Matrículas)

- **Advanced Features**:
  - Pagination and search functionality
  - Data validation and error handling
  - Relationship management between entities
  - Bulk operations for enrollments
  - Password hashing for user accounts
  - Health check endpoints
  - Graceful shutdown handling

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Prisma client configuration
│   ├── controllers/
│   │   ├── alunoController.ts   # Student operations
│   │   ├── cursoController.ts   # Course operations
│   │   ├── disciplinaController.ts # Subject operations
│   │   ├── matriculaController.ts # Enrollment operations
│   │   ├── periodoLetivoController.ts # Academic period operations
│   │   └── userController.ts    # User operations
│   └── routes/
│       ├── index.ts            # Main routes file
│       ├── alunoRoutes.ts      # Student routes
│       ├── cursoRoutes.ts      # Course routes
│       ├── disciplinaRoutes.ts # Subject routes
│       ├── matriculaRoutes.ts  # Enrollment routes
│       ├── periodoLetivoRoutes.ts # Academic period routes
│       └── userRoutes.ts       # User routes
├── prisma/
│   └── schema.prisma           # Database schema
├── server.ts                   # Main server file
├── package.json               # Dependencies and scripts
└── .env.example               # Environment variables template
```

## API Endpoints

### Health Check
- `GET /health` - Server health check
- `GET /health/db` - Database connection check

### Courses (Cursos)
- `GET /api/cursos` - Get all courses (with pagination and search)
- `GET /api/cursos/:id` - Get course by ID
- `POST /api/cursos` - Create new course
- `PUT /api/cursos/:id` - Update course
- `DELETE /api/cursos/:id` - Delete course

### Subjects (Disciplinas)
- `GET /api/disciplinas` - Get all subjects (with filters)
- `GET /api/disciplinas/:id` - Get subject by ID
- `POST /api/disciplinas` - Create new subject
- `PUT /api/disciplinas/:id` - Update subject
- `DELETE /api/disciplinas/:id` - Delete subject
- `GET /api/disciplinas/curso/:cursoId` - Get subjects by course

### Students (Alunos)
- `GET /api/alunos` - Get all students (with pagination and search)
- `GET /api/alunos/:id` - Get student by ID
- `POST /api/alunos` - Create new student
- `PUT /api/alunos/:id` - Update student
- `DELETE /api/alunos/:id` - Delete student
- `GET /api/alunos/curso/:cursoId` - Get students by course
- `GET /api/alunos/:id/matriculas` - Get student enrollments

### Users
- `GET /api/users` - Get all users (with pagination and search)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update user password
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/role/:role` - Get users by role

### Academic Periods (Períodos Letivos)
- `GET /api/periodos` - Get all academic periods
- `GET /api/periodos/active` - Get current active period
- `GET /api/periodos/:id` - Get academic period by ID
- `POST /api/periodos` - Create new academic period
- `PUT /api/periodos/:id` - Update academic period
- `PUT /api/periodos/:id/activate` - Activate specific period
- `DELETE /api/periodos/:id` - Delete academic period

### Enrollments (Matrículas)
- `GET /api/matriculas` - Get all enrollments (with filters)
- `GET /api/matriculas/:id` - Get enrollment by ID
- `POST /api/matriculas` - Create new enrollment
- `POST /api/matriculas/bulk` - Bulk create enrollments
- `PUT /api/matriculas/:id` - Update enrollment status
- `DELETE /api/matriculas/:id` - Delete enrollment
- `GET /api/matriculas/aluno/:alunoId` - Get enrollments by student
- `GET /api/matriculas/disciplina/:disciplinaId` - Get enrollments by subject
- `GET /api/matriculas/periodo/:periodoId` - Get enrollments by period

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and configuration.

4. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

## Database Schema

The application uses the following main entities:

- **Curso** (Course): Academic courses
- **Disciplina** (Subject): Subjects within courses
- **Aluno** (Student): Student information
- **User**: User accounts with roles (STUDENT, TEACHER, ADMIN)
- **PeriodoLetivo** (Academic Period): Academic periods/semesters
- **Matricula** (Enrollment): Student enrollments in subjects

## Key Features

### Data Validation
- Input validation for all endpoints
- Relationship validation (e.g., student and subject must belong to same course)
- Business logic validation (e.g., no overlapping active periods)

### Error Handling
- Comprehensive error handling with appropriate HTTP status codes
- Detailed error messages in development mode
- Graceful error responses in production

### Security
- Password hashing using bcrypt
- CORS configuration
- Helmet for security headers
- Request timeout handling

### Performance
- Database connection pooling
- Pagination for large datasets
- Efficient database queries with Prisma

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:deploy` - Deploy migrations to production

## Contributing

1. Follow the existing code structure and naming conventions
2. Add proper error handling for new endpoints
3. Include input validation for all user inputs
4. Update this README when adding new features

## License

This project is licensed under the ISC License.