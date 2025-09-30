# Docker Setup for ABP Backend

This directory contains Docker configuration files for running the ABP backend application.

## Files Overview

- `dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yml` - Complete application stack with database
- `.env.example` - Environment variables template

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit environment variables:**
   Update the `.env` file with your specific configuration, especially:
   - `POSTGRES_PASSWORD` - Set a secure database password
   - `JWT_SECRET` - Set a long, random JWT secret key

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Check application status:**
   ```bash
   docker-compose ps
   ```

## Services Included

### Core Services
- **backend** - Node.js/TypeScript API server (Port: 3000)
- **postgres** - PostgreSQL database (Port: 5432)

### Optional Services
- **redis** - Redis cache (Port: 6379)
- **pgadmin** - Database management UI (Port: 5050)

To start with optional services:
```bash
docker-compose --profile tools up -d
```

## Useful Commands

### Development
```bash
# Start in development mode with logs
docker-compose up

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f backend

# Execute commands in running container
docker-compose exec backend npm run prisma:migrate
```

### Production
```bash
# Start in detached mode
docker-compose up -d

# Update and restart services
docker-compose pull && docker-compose up -d
```

### Database Management
```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Access database directly
docker-compose exec postgres psql -U postgres -d abp_database
```

### Cleanup
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Remove unused Docker resources
docker system prune -a
```

## Health Checks

The application includes health check endpoints:
- **Application Health:** http://localhost:3000/health
- **Database Health:** http://localhost:3000/health/db

## Accessing Services

- **Backend API:** http://localhost:3000
- **pgAdmin:** http://localhost:5050 (if using --profile tools)
  - Email: admin@admin.com
  - Password: admin

## Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | production |
| `PORT` | Backend port | 3000 |
| `POSTGRES_PASSWORD` | Database password | postgres |
| `JWT_SECRET` | JWT signing secret | (must be set) |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3001 |

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in `.env` file if default ports are in use

2. **Database connection issues:**
   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Check database logs: `docker-compose logs postgres`

3. **Build failures:**
   - Clear Docker cache: `docker builder prune`
   - Rebuild without cache: `docker-compose build --no-cache`

4. **Permission issues:**
   - Ensure Docker has proper permissions
   - On Linux, add user to docker group: `sudo usermod -aG docker $USER`

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

## Security Notes

- Change default passwords in production
- Use strong JWT secrets
- Consider using Docker secrets for sensitive data
- Regularly update base images for security patches