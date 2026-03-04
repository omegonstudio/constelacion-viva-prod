# Frontend-Backend Integration Guide

## API Base URL

```typescript
// For development
const API_BASE = "http://localhost:8000";

// For production
const API_BASE = "https://api.constelacionviva.com";
```

## Authentication

### 1. Register

```typescript
async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantId: number
) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      tenant_id: tenantId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  // Store tokens securely
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  return data;
}
```

### 2. Login

```typescript
async function login(email: string, password: string, tenantId: number) {
  const response = await fetch(`${API_BASE}/auth/login?tenant_id=${tenantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  return data;
}
```

### 3. Refresh Token

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Refresh failed, redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    return;
  }

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  return data;
}
```

### 4. API Helper with Auth

```typescript
async function apiCall(endpoint: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try refreshing token
  if (response.status === 401) {
    await refreshAccessToken();
    accessToken = localStorage.getItem("access_token");

    headers.Authorization = `Bearer ${accessToken}`;
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "API error");
  }

  return response.json();
}
```

## User Profile

### Get Current User

```typescript
async function getCurrentUser() {
  return apiCall("/users/me");
}
```

### Update Profile

```typescript
async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  bio?: string;
  preferred_language?: "es_lat" | "en" | "pt";
  profile_image_url?: string;
}) {
  return apiCall("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
```

## Courses

### List Published Courses

```typescript
async function listCourses(skip = 0, limit = 50) {
  return apiCall(`/courses?skip=${skip}&limit=${limit}&published_only=true`);
}
```

### Get Course Details

```typescript
async function getCourse(courseId: number) {
  return apiCall(`/courses/${courseId}`);
}
```

### Create Course (Therapist)

```typescript
async function createCourse(data: {
  title_es: string;
  title_en?: string;
  title_pt?: string;
  description_es?: string;
  description_en?: string;
  description_pt?: string;
  is_free: boolean;
  price?: number;
  thumbnail_url?: string;
}) {
  return apiCall("/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

### Update Course

```typescript
async function updateCourse(
  courseId: number,
  data: {
    title_es?: string;
    title_en?: string;
    title_pt?: string;
    description_es?: string;
    description_en?: string;
    description_pt?: string;
    is_free?: boolean;
    price?: number;
    thumbnail_url?: string;
    is_published?: boolean;
  }
) {
  return apiCall(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
```

### Publish Course

```typescript
async function publishCourse(courseId: number) {
  return apiCall(`/courses/${courseId}/publish`, {
    method: "POST",
  });
}
```

### Enroll in Course

```typescript
async function enrollCourse(courseId: number) {
  return apiCall(`/courses/${courseId}/enroll`, {
    method: "POST",
  });
}
```

### Get Course Progress

```typescript
async function getCourseProgress(courseId: number) {
  return apiCall(`/courses/${courseId}/progress`);
}
```

## Admin/CMS

### List CMS Content

```typescript
async function listCMSContent(skip = 0, limit = 50) {
  return apiCall(`/admin/cms?skip=${skip}&limit=${limit}`);
}
```

### Create CMS Content

```typescript
async function createCMSContent(data: {
  key: string;
  content_es: string;
  content_en?: string;
  content_pt?: string;
  image_url?: string;
}) {
  return apiCall("/admin/cms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

### Update CMS Content

```typescript
async function updateCMSContent(
  contentId: number,
  data: {
    content_es?: string;
    content_en?: string;
    content_pt?: string;
    image_url?: string;
  }
) {
  return apiCall(`/admin/cms/${contentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
```

### Delete CMS Content

```typescript
async function deleteCMSContent(contentId: number) {
  return apiCall(`/admin/cms/${contentId}`, {
    method: "DELETE",
  });
}
```

## React Hook Examples

### useAuth Hook

```typescript
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
```

### useCourse Hook

```typescript
import { useEffect, useState } from "react";

export function useCourse(courseId: number) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCourse(courseId)
      .then(setCourse)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [courseId]);

  return { course, loading, error };
}
```

### useCourseProgress Hook

```typescript
import { useEffect, useState } from "react";

export function useCourseProgress(courseId: number) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourseProgress(courseId)
      .then(setProgress)
      .finally(() => setLoading(false));
  }, [courseId]);

  return { progress, loading };
}
```

## Error Handling

```typescript
async function handleApiError(error: Error) {
  if (error.message.includes("401")) {
    // Unauthorized - redirect to login
    window.location.href = "/login";
  } else if (error.message.includes("403")) {
    // Forbidden - show permission denied
    console.error("Access denied");
  } else if (error.message.includes("404")) {
    // Not found
    console.error("Resource not found");
  } else {
    // Generic error
    console.error("Error:", error.message);
  }
}
```

## Multilingual Support

The API returns multilingual content. On the frontend, select based on user preference:

```typescript
function getContent(item: any, language: "es_lat" | "en" | "pt" = "es_lat") {
  const field = `title_${language === "es_lat" ? "es" : language}`;
  return item[field] || item.title_es;
}
```

## Media Upload

For uploading files:

1. Call backend endpoint to get presigned URL
2. Upload directly to S3 using the URL
3. Save the S3 key in the database

```typescript
// Get presigned URL from backend
const presignedUrl = await apiCall("/media/get-upload-url", {
  method: "POST",
  body: JSON.stringify({
    content_type: "video/mp4",
    filename: "lesson.mp4",
  }),
});

// Upload to S3 directly
const file = inputRef.current?.files?.[0];
if (file) {
  await fetch(presignedUrl.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}
```

## Webhook Integration (Payments)

When Mercado Pago sends payment notifications:

```typescript
// Backend receives webhook
POST / webhooks / mercado - pago;

// Backend validates and:
// 1. Updates payment status
// 2. Grants course access
// 3. Sends confirmation email
```

## TypeScript Interfaces

```typescript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "therapist" | "sponsor" | "student";
  is_active: boolean;
  is_verified: boolean;
  profile_image_url?: string;
  preferred_language: "es_lat" | "en" | "pt";
  created_at: string;
}

interface Course {
  id: number;
  creator_id: number;
  title_es: string;
  title_en?: string;
  title_pt?: string;
  description_es?: string;
  description_en?: string;
  description_pt?: string;
  is_free: boolean;
  price?: number;
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id: number;
  module_id: number;
  title_es: string;
  title_en?: string;
  title_pt?: string;
  content_type: "video" | "text" | "pdf";
  content_text?: string;
  s3_key?: string;
  duration_seconds?: number;
  order: number;
  is_locked: boolean;
  created_at: string;
}

interface CourseProgress {
  id: number;
  course_id: number;
  completion_percentage: number;
  started_at: string;
  completed_at?: string;
  lesson_progress: LessonProgress[];
}

interface LessonProgress {
  id: number;
  lesson_id: number;
  is_completed: boolean;
  watched_seconds: number;
  started_at?: string;
  completed_at?: string;
}
```

## Environment Variables (Frontend)

```env
NEXT_PUBLIC_API_URL=https://constelacionviva.com/api
```
