# Skynet API Reference

Base URL: `http://localhost:8000`  
Authentication: All protected endpoints require `Authorization: Bearer <token>`

---

## Auth

### POST /auth/login
Authenticate and receive a JWT access token.

**Request body:**
```json
{ "email": "dispatcher@airman.local", "password": "dispatcher" }
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 2, "full_name": "Dispatch Officer", "email": "...", "role": "DISPATCHER", "base_id": 1, "created_at": "..." }
}
```

---

### GET /auth/me
Returns the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

---

## Sorties

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/sorties` | DISPATCHER | Create a new sortie |
| `GET` | `/sorties` | All | List sorties (role-filtered) |
| `GET` | `/sorties/{id}` | All | Get sortie detail |
| `PATCH` | `/sorties/{id}/release` | DISPATCHER | SCHEDULED → RELEASED |
| `PATCH` | `/sorties/{id}/airborne` | DISPATCHER | RELEASED → AIRBORNE |
| `PATCH` | `/sorties/{id}/landed` | DISPATCHER | AIRBORNE → LANDED |
| `PATCH` | `/sorties/{id}/cancel` | DISPATCHER | Cancel sortie |
| `PATCH` | `/sorties/{id}/close` | DISPATCHER, CFI | TRAINING_APPROVED → CLOSED |

**Create body:**
```json
{
  "sortie_number": "SRT-010",
  "cadet_id": 5, "instructor_id": 3, "aircraft_id": 1, "base_id": 1,
  "lesson_type": "Circuits",
  "scheduled_start": "2026-05-22T06:00:00", "scheduled_end": "2026-05-22T07:30:00"
}
```

---

## Training Progress

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/training-progress` | INSTRUCTOR | Create record for a sortie |
| `GET` | `/training-progress/{sortie_id}` | All | Get records for sortie |
| `PATCH` | `/training-progress/{id}/submit` | INSTRUCTOR | DRAFT → SUBMITTED |
| `PATCH` | `/training-progress/{id}/approve` | CFI | SUBMITTED → APPROVED |
| `PATCH` | `/training-progress/{id}/reject` | CFI | SUBMITTED → REJECTED |

---

## Aircraft

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/aircraft` | All | List all aircraft |
| `GET` | `/aircraft/{id}` | All | Get aircraft detail |
| `POST` | `/aircraft` | ADMIN, DISPATCHER | Register new aircraft |
| `PATCH` | `/aircraft/{id}/status` | MAINTENANCE_OFFICER, DISPATCHER | Update status |

---

## Defects

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/defects` | MAINTENANCE_OFFICER, DISPATCHER | Report a defect (grounds aircraft) |
| `GET` | `/defects` | All | List all defects |
| `GET` | `/defects/{id}` | All | Get defect detail |
| `PATCH` | `/defects/{id}/resolve` | MAINTENANCE_OFFICER | Resolve with recovery decision |

---

## Users

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/users` | ADMIN, DISPATCHER | List users |
| `GET` | `/users/me` | All | Own profile |
| `GET` | `/users/{id}` | ADMIN, DISPATCHER | Get user |
| `POST` | `/users` | ADMIN | Create user |
| `PATCH` | `/users/{id}` | ADMIN | Update user |

---

## Audit Logs

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/audit-logs` | ADMIN, DISPATCHER | Paginated audit trail |

**Query params:** `entity_type`, `entity_id`, `actor_id`, `limit` (≤500), `offset`

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid JWT |
| 403 | Insufficient role |
| 404 | Resource not found |
| 400 | Invalid state transition or business rule violation |
| 409 | Conflict (e.g. duplicate email) |
