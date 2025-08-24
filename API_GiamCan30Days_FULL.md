# Giảm Cân 30 Days — Backend API (FULL SPEC) v1

**Phạm vi:** Toàn bộ dự án gồm **Core (MVP)** + **Bứt Phá**  
**Đối tượng:** Dev backend/frontend, QA, Integrator, Amazon Q Docs  
**Base URL:** `https://api.giamcan30days.com/v1` (placeholder)  
**Auth:** JWT Bearer – `Authorization: Bearer <access_token>`  
**Content-Type:** `application/json`  
**Time:** Server lưu **UTC ISO 8601** (`YYYY-MM-DDTHH:mm:ss.sssZ`) – client tự convert

> Tài liệu này là **đặc tả API** (không phải code). Có thể sinh OpenAPI/YAML từ nội dung này.

---

## Mục lục

- [1. Nguyên tắc chung](#1-nguyên-tắc-chung)
- [2. Mô hình dữ liệu & Enum](#2-mô-hình-dữ-liệu--enum)
- [3. Core API (MVP)](#3-core-api-mvp)
  - [3.1 Auth & Users](#31-auth--users)
  - [3.2 Profile, Goals, TDEE](#32-profile-goals-tdee)
  - [3.3 Weights (Cân nặng)](#33-weights-cân-nặng)
  - [3.4 Meals (Bữa ăn)](#34-meals-bữa-ăn)
  - [3.5 Workouts (Buổi tập)](#35-workouts-buổi-tập)
  - [3.6 Plan 30 Days](#36-plan-30-days)
  - [3.7 Photos (Upload/Confirm)](#37-photos-uploadconfirm)
  - [3.8 Devices & Local Reminders](#38-devices--local-reminders)
  - [3.9 Export/Import dữ liệu](#39-exportimport-dữ-liệu)
- [4. Bứt Phá API (Gamification, AI, Challenge…)](#4-bứt-phá-api-gamification-ai-challenge)
  - [4.1 Gamification (XP • Streak • Quests • Avatar)](#41-gamification-xp--streak--quests--avatar)
  - [4.2 AI Jobs (Meal/Body Analysis)](#42-ai-jobs-mealbody-analysis)
  - [4.3 Challenges & Leaderboard](#43-challenges--leaderboard)
  - [4.4 Battle Mode 1–1](#44-battle-mode-11)
  - [4.5 Feed cá nhân & Reactions](#45-feed-cá-nhân--reactions)
  - [4.6 AI Coach (Suggest • Adjust • Nudge)](#46-ai-coach-suggest--adjust--nudge)
  - [4.7 Integrations (Health/Fit)](#47-integrations-healthfit)
- [5. Admin API](#5-admin-api)
- [6. Webhooks](#6-webhooks)
- [7. Lỗi • Rate Limit • Idempotency • Pagination • Versioning](#7-lỗi--rate-limit--idempotency--pagination--versioning)
- [8. Bảo mật & Quyền riêng tư](#8-bảo-mật--quyền-riêng-tư)
- [9. Phụ lục: Quy ước • OpenAPI Tag map • Env Vars](#9-phụ-lục-quy-ước--openapi-tag-map--env-vars)
- [10. User flows mẫu](#10-user-flows-mẫu)

---

## 1. Nguyên tắc chung

- **Versioning:** `/v1`. Breaking change ⇒ `/v2`.
- **Auth:** JWT Bearer. Access TTL ngắn (15–60m), Refresh TTL dài (7–30d, rolling).
- **Pagination:** `?limit=20&cursor=<opaque>` → trả `next_cursor` nếu còn.
- **Filter:** `?date=YYYY-MM-DD` hoặc `?from=&to=`.
- **Idempotency:** yêu cầu với hành vi có thể bấm lặp: upload confirm, join challenge, XP event quan trọng…
  - Header: `Idempotency-Key: <uuid-v4>`
  - Server lưu map `key → response` TTL 24h.
- **Error Model:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "grams must be > 0",
    "details": { "field": "grams" }
  }
}
```

- **Number precision:** `weightKg` đến 0.1; `kcal` `int`; `macros` `int` gram.

---

## 2. Mô hình dữ liệu & Enum

**Collections (MongoDB gợi ý):**

- `users(_id, email, passwordHash, name, roles[], createdAt, appleSub?)`
- `profiles(userId, sex, heightCm, startWeightKg, currentWeightKg, birthYear, activity, tdee, kcalTarget, updatedAt)`
- `weights(_id, userId, dateISO(YYYY-MM-DD), weightKg, note, updatedAt)`
- `meals(_id, userId, dateISO, name, grams, kcal, protein, note, photoIds[], updatedAt)`
- `workouts(_id, userId, dateISO, type(A|B|C|cardio), minutes, kcal, note, photoIds[], updatedAt)`
- `photos(_id, userId, contextType(meal|workout|body), contextId, fileKey, width, height, takenAt, createdAt)`
- `gamification(userId, xp, level, streakDays, avatarStage, lastActionAt)`
- `quests(id, title, cadence(daily|weekly), ruleKey, reward({xp,badge}))`
- `plans(userId, dayIndex(0–29), preset(A|B|C), done(bool), doneAt)`
- `challenges(id, title, durationDays, rules[], startMode(fixed|rolling), prizes[], status(open|closed))`
- `challenge_members(challengeId, userId, joinedAt, progress, score)`
- `battles(id, creatorId, opponentId, durationDays, metric(weight_pct), stake, status(pending|active|ended), createdAt)`
- `devices(userId, deviceId, expoPushToken, platform(ios|android), lastActiveAt)`
- `reminders(userId, id, title, timeLocal, daysOfWeek[], enabled, nagAfterMins)`
- `events(userId, type, payload, at)`

**Enums:**

- `sex`: `male|female`
- `activity`: `sedentary|light|moderate|active|athlete`
- `workout.type`: `A|B|C|cardio`
- `contextType`: `meal|workout|body`

---

## 3. Core API (MVP)

### 3.1 Auth & Users

**POST `/auth/register`**

```json
{ "email": "user@example.com", "password": "min8chars", "name": "John Doe" }
```

`201`

```json
{ "userId": "u_123", "accessToken": "...", "refreshToken": "..." }
```

**POST `/auth/login`**

```json
{ "email": "user@example.com", "password": "..." }
```

**POST `/auth/token/refresh`**

```json
{ "refreshToken": "..." }
```

**POST `/auth/logout`** – revoke access/refresh (optional body: refreshToken)

---

### 3.2 Profile, Goals, TDEE

**GET `/me/profile`** → thông tin & `tdee`, `kcalTarget`  
**PUT `/me/profile`**

```json
{
  "sex": "male",
  "heightCm": 170,
  "currentWeightKg": 86,
  "birthYear": 2003,
  "activity": "sedentary"
}
```

> Server tự tính lại `tdee` theo Mifflin St Jeor & hệ số hoạt động.

**PUT `/me/goals`**

```json
{ "dailyKcalTarget": 1800, "proteinTarget": 120 }
```

---

### 3.3 Weights (Cân nặng)

**GET `/weights?from=2025-08-01&to=2025-08-31`**  
**POST `/weights`**

```json
{ "dateISO": "2025-08-23T07:00:00Z", "weightKg": 84.8, "note": "" }
```

**PUT `/weights/:id`**, **DELETE `/weights/:id`**

> Unique: `(userId, date)` theo ngày (UTC). `CONFLICT` khi trùng.

---

### 3.4 Meals (Bữa ăn)

**GET `/meals?date=2025-08-23&limit=20&cursor=...`**  
**POST `/meals`**

```json
{
  "dateISO": "2025-08-23T12:30:00Z",
  "name": "Ức gà + rau",
  "grams": 300,
  "kcal": 450,
  "protein": 50,
  "note": "luộc",
  "photoIds": ["p_456"]
}
```

**PUT `/meals/:id`**, **DELETE `/meals/:id`**

---

### 3.5 Workouts (Buổi tập)

**GET `/workouts?date=2025-08-23`**  
**POST `/workouts`**

```json
{
  "dateISO": "2025-08-23T19:00:00Z",
  "type": "A",
  "minutes": 45,
  "kcal": 280,
  "note": "cardio 20'",
  "photoIds": ["p_777"]
}
```

**PUT `/workouts/:id`**, **DELETE `/workouts/:id`**

---

### 3.6 Plan 30 Days

**GET `/plan`** → danh sách 30 ngày `{ dayIndex, preset, done, doneAt }`  
**POST `/plan/:dayIndex/done`**

```json
{ "done": true, "doneAt": "2025-08-23T20:30:00Z" }
```

---

### 3.7 Photos (Upload/Confirm)

**POST `/photos/presign`**

```json
{ "contextType": "meal", "contextId": "m_123", "contentType": "image/jpeg" }
```

`200` → `{ "uploadUrl":"https://s3...", "fileKey":"u_123/2025/08/23/abc.jpg", "expiresIn":600 }`

**POST `/photos/confirm`** (Idempotency-Key)

```json
{
  "fileKey": "u_123/2025/08/23/abc.jpg",
  "contextType": "meal",
  "contextId": "m_123",
  "width": 1200,
  "height": 1600,
  "takenAt": "2025-08-23T12:00:00Z"
}
```

`201` → `{ "photoId":"p_456" }`

**GET `/photos?contextType=meal&contextId=m_123`**  
**DELETE `/photos/:id`** (xóa bản ghi + object)

> Chỉ nhận `image/jpeg|webp`, ≤ 5MB. Khuyến khích nén client 1200–1600px cạnh dài.

---

### 3.8 Devices & Local Reminders

**POST `/devices/register`**

```json
{
  "deviceId": "ios-uuid",
  "expoPushToken": "ExponentPushToken[xxx]",
  "platform": "ios"
}
```

**PUT `/me/reminders`**

```json
[
  {
    "id": "wakeup",
    "title": "Uống nước + cân",
    "timeLocal": "07:00",
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
    "enabled": true
  },
  {
    "id": "workout",
    "title": "Đi tập",
    "timeLocal": "19:00",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "enabled": true
  }
]
```

---

### 3.9 Export/Import dữ liệu

**GET `/me/export`** → JSON gồm weights, meals, workouts, photos(meta), plan, gamification.  
**POST `/me/import`** → nạp JSON (server validate, merge theo `updatedAt`).

---

## 4. Bứt Phá API (Gamification, AI, Challenge…)

### 4.1 Gamification (XP • Streak • Quests • Avatar)

**GET `/me/gamification`**

```json
{
  "xp": 1340,
  "level": 5,
  "streakDays": 12,
  "avatarStage": "lean-2",
  "nextLevelXp": 1500,
  "lastActionAt": "2025-08-22T21:20:00Z"
}
```

**POST `/me/gamification/events`** (Idempotency-Key)

```json
{ "type": "meal.logged", "value": 1, "contextId": "m_789" }
```

`200` → `{ "addedXp":5, "xp":1345, "streakDays":13 }`

**GET `/quests/today`** → danh sách nhiệm vụ ngày/tuần  
**POST `/quests/complete`** → `{ "questId":"q_water_2l" }`

---

### 4.2 AI Jobs (Meal/Body Analysis)

**POST `/ai/meal/analyze`** → `{ "photoId":"p_456" }` → `202 { "jobId":"j_abc" }`  
**POST `/ai/body/analyze`** → `{ "photoId":"p_999" }` → `202 { "jobId":"j_def" }`  
**GET `/ai/jobs/:jobId`**

```json
{
  "status": "succeeded",
  "result": {
    "foodTags": ["chicken breast"],
    "estKcal": 420,
    "macros": { "protein": 48, "carb": 25, "fat": 10 },
    "warnings": ["fried:false"],
    "confidence": 0.78
  }
}
```

> Rate: 10 jobs/giờ/user.

---

### 4.3 Challenges & Leaderboard

**GET `/challenges?status=open`**

```json
[
  {
    "id": "ch_30_no_sugar",
    "title": "No Sugar 30 Days",
    "durationDays": 30,
    "rules": ["no sugary drinks"],
    "startMode": "rolling",
    "prizes": ["badge:no-sugar", "xp:500"],
    "status": "open"
  }
]
```

**POST `/challenges/:id/join`** (Idempotency-Key)  
**POST `/challenges/:id/day/:n/complete`** → `{ "proofPhotoId":"p_abc" }`  
**GET `/challenges/:id/leaderboard?metric=weight_pct&limit=50`** → `{ rank, user, value, trend }`

---

### 4.4 Battle Mode 1–1

**POST `/battles`**

```json
{
  "opponentUserId": "u_456",
  "durationDays": 30,
  "metric": "weight_pct",
  "stake": "xp:300"
}
```

**POST `/battles/:id/accept`**, **POST `/battles/:id/reject`**  
**GET `/battles/:id/score`** → % thay đổi so với baseline

---

### 4.5 Feed cá nhân & Reactions

**GET `/feed/me?limit=20&cursor=...`** → entries ảnh (meal/workout/body) + ngày + XP.  
**POST `/feed/:entryId/react`** → `{ "type":"clap" }` (`like|clap|fire`).

---

### 4.6 AI Coach (Suggest • Adjust • Nudge)

**POST `/coach/meal-suggest`**

```json
{
  "budgetVND": 50000,
  "available": ["ức gà", "rau cải", "khoai lang"],
  "goalKcal": 1800,
  "todayMacros": { "protein": 60, "carb": 120, "fat": 30 }
}
```

**POST `/coach/workout-adjust`** → `{ "yesterdayDone":false, "fatigue":"medium" }`  
**POST `/coach/nudge/schedule`**

```json
{
  "rules": [
    {
      "if": "no_workout_by_19:30",
      "then": "push:'Đi tập 20’ thôi!'",
      "nagAfterMins": 30
    }
  ]
}
```

---

### 4.7 Integrations (Health/Fit)

**POST `/integrations/health/import`**

```json
{
  "date": "2025-08-23",
  "steps": 10342,
  "activeEnergyKcal": 420,
  "workouts": [{ "type": "walking", "minutes": 35, "kcal": 180 }]
}
```

---

## 5. Admin API

Yêu cầu JWT role `admin`.

- **GET `/admin/ai/models`** – danh sách model dùng cho meal/body analysis.
- **PUT `/admin/ai/thresholds`** – `confidenceMin`, ngưỡng cảnh báo chiên/ngọt.
- **POST `/admin/challenges`** – tạo challenge mẫu.
- **GET `/admin/users/:id/audit`** – nhật ký hoạt động.
- **PUT `/admin/quests`** – cấu hình nhiệm vụ ngày/tuần (ruleKey → reward).

---

## 6. Webhooks

Server có thể bắn webhook (tùy chọn) đến hệ thống của bạn:

- `ai.job.completed` – khi meal/body analysis xong.
- `challenge.day.completed` – khi user hoàn thành ngày trong challenge.
- `battle.ended` – khi trận 1–1 kết thúc.  
  **Format:**

```json
{ "type":"ai.job.completed", "data":{ "jobId":"j_abc", "userId":"u_123", "result":{...} }, "sentAt":"2025-08-23T12:00:00Z", "signature":"hmac-sha256" }
```

> Cấu hình endpoint & secret: `/me/webhooks` (tùy chọn mở rộng).

---

## 7. Lỗi • Rate Limit • Idempotency • Pagination • Versioning

**Mã lỗi phổ biến:** `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `CONFLICT`, `UPLOAD_FAILED`, `AI_JOB_FAILED`  
**Rate limit:** 60 req/phút/user; AI jobs 10 job/giờ.  
**Idempotency:** bắt buộc `POST /photos/confirm`, `POST /challenges/:id/join`, sự kiện XP quan trọng.  
**Pagination (Cursor):**

```http
GET /meals?limit=20&cursor=eyJvZmZzZXQiOjIwMH0=
```

```json
{
  "items": [
    /* ... */
  ],
  "next_cursor": "..."
}
```

**Versioning:** `Accept: application/vnd.gc30.v1+json` (tùy chọn nâng cao song song `/v1`).

---

## 8. Bảo mật & Quyền riêng tư

- **Mật khẩu:** `argon2`/`bcrypt`.
- **JWT:** access ngắn, refresh dài (rotating refresh).
- **Ảnh riêng tư:** `DELETE /photos/:id` xóa cả DB + object storage (S3/R2).
- **PII tối thiểu:** email, tên; không lưu thông tin nhạy cảm khác.
- **Sao lưu/khôi phục:** dùng `GET /me/export`, `POST /me/import`.
- **Audit:** ghi `events` quan trọng phục vụ điều tra/troubleshoot.

---

## 9. Phụ lục: Quy ước • OpenAPI Tag map • Env Vars

**Quy ước ID:** tiền tố `u_`, `m_`, `w_`, `p_`, `j_`, `ch_`, `bat_`, `dev_`…  
**OpenAPI Tag map (gợi ý):**

- `Auth`, `Profile`, `Weights`, `Meals`, `Workouts`, `Plan`, `Photos`, `Gamification`, `Quests`, `AI`, `Challenges`, `Battles`, `Feed`, `Coach`, `Devices`, `Reminders`, `Integrations`, `Admin`
  **Env Vars (backend gợi ý):**
- `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`
- `STORAGE_PROVIDER=S3|R2|SUPABASE`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `EXPO_PUSH_ACCESS_TOKEN` (nếu dùng push qua Expo)
- `AI_PROVIDER` (OpenAI/Bedrock/Other), `AI_API_KEY`
- `WEBHOOK_SECRET`

---

## 10. User flows mẫu

### A) Check‑in món ăn + AI kcal

1. `POST /photos/presign` → `uploadUrl,fileKey`
2. PUT ảnh → `uploadUrl`
3. `POST /photos/confirm` (Idempotency-Key) → `photoId`
4. `POST /meals` gắn `photoIds:[photoId]`
5. `POST /ai/meal/analyze` → `jobId`
6. `GET /ai/jobs/:jobId` → `estKcal, macros`
7. `PUT /meals/:id` cập nhật kcal/macros
8. `POST /me/gamification/events { type:"meal.logged" }`

### B) Tick workout + XP/Streak

1. `POST /workouts` (hoặc `POST /plan/:dayIndex/done`)
2. `POST /me/gamification/events { type:"workout.completed" }`
3. 19:30 chưa workout → server push **nudge** (dựa `/devices/register`).

### C) Join challenge + leaderboard

1. `GET /challenges?status=open`
2. `POST /challenges/:id/join`
3. Hằng ngày: `POST /challenges/:id/day/:n/complete { proofPhotoId }`
4. `GET /challenges/:id/leaderboard?metric=weight_pct`

---

> **Kết thúc FULL SPEC**
