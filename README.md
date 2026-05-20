# Internshala Backend Assignment

FastAPI REST API with JWT authentication, role-based access, Postgres, Docker Compose, and a Vanilla JS dashboard.

## Features

- User registration and login with direct `bcrypt` password hashing
- JWT bearer authentication using `python-jose`
- First registered account becomes `admin`; later accounts become `user`
- Role-based admin endpoints for viewing all users and notes
- Note CRUD APIs for authenticated users
- Pydantic validation and normalized API validation errors
- Swagger docs at `/docs`
- Vanilla JS frontend served from the same FastAPI app
- Postgres service in Docker Compose

## Project Structure

```text
backend/
  api/          # Versioned route modules
  core/         # Config, DB session, auth dependencies, security helpers
  models/       # SQLAlchemy models
  schemas/      # Pydantic request/response models
frontend/       # Vanilla JS dashboard served by FastAPI
Dockerfile
docker-compose.yml
```

## Run With Docker Compose

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

The API container creates the database tables at startup. For production, replace `JWT_SECRET_KEY` in `docker-compose.yml` with a long random secret.

## API Overview

Base path: `/api/v1`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create an account |
| `POST` | `/auth/login` | Public | Get a JWT token |
| `GET` | `/auth/me` | User/Admin | Current user |
| `GET` | `/notes` | User/Admin | List your notes |
| `POST` | `/notes` | User/Admin | Create a note |
| `GET` | `/notes/{id}` | Owner/Admin | Read one note |
| `PATCH` | `/notes/{id}` | Owner/Admin | Update one note |
| `DELETE` | `/notes/{id}` | Owner/Admin | Delete one note |
| `GET` | `/admin/users` | Admin | List users |
| `GET` | `/admin/notes` | Admin | List all notes |

Example login response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-05-20T00:00:00Z"
  }
}
```

Use the token as:

```http
Authorization: Bearer jwt-token
```

## Environment Variables

See `.env.example`.

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy Postgres connection URL |
| `JWT_SECRET_KEY` | Secret used to sign JWTs |
| `JWT_ACCESS_TOKEN_MINUTES` | Access token expiry |
| `FRONTEND_ORIGINS` | Comma-separated CORS origins |

## Scalability Note

The app is split by API, models, schemas, and core infrastructure so new modules can be added without crowding the main file. For a larger deployment, add Alembic migrations, refresh tokens, Redis caching for expensive reads, structured logging, centralized secrets, and run the API behind a load balancer with multiple Uvicorn workers.
