# 📦 Persistencia de Eventos - Documentación

## 🎯 Visión General

Sistema de persistencia robusto que guarda automáticamente el estado del evento en `localStorage` con:

- ✅ Debounce integrado (500ms por defecto)
- ✅ Manejo seguro de SSR (sin errores de hydration mismatch)
- ✅ TypeScript 100% tipado
- ✅ Parsing seguro con try/catch
- ✅ Sin dependencias externas

## 📂 Estructura de Archivos

```
lib/
  └─ types/
      └─ event.ts          # Tipos centralizados (EventData, ItineraryItem)
hooks/
  └─ use-event-storage.ts  # Hook principal de persistencia
app/
  └─ page.tsx              # Página actualizada (usa el hook)
```

## 🔧 Componentes

### 1️⃣ `lib/types/event.ts`

Define la interfaz `EventData` y el estado inicial `DEFAULT_EVENT_DATA`.

**Ventajas:**

- Un único origen de verdad para el tipo
- Fácil de reutilizar en otros componentes
- Garantía de consistencia tipada

### 2️⃣ `hooks/use-event-storage.ts`

Hook personalizado con toda la lógica de persistencia.

**Características:**

- `eventData`: Estado actual del evento
- `setEventData`: Setter para actualizar estado
- `clearDraft`: Limpia el localStorage y reinicia al estado por defecto
- `isHydrated`: Indica si los datos fueron restaurados del localStorage

**Debounce**: Espera 500ms después del último cambio antes de guardar en localStorage (evita escribir en cada keystroke).

### 3️⃣ `app/page.tsx`

Página principal actualizada para usar el hook.

**Cambios principales:**

```tsx
// Antes: estado manual
const [eventData, setEventData] = useState({...})

// Ahora: persistencia automática
const { eventData, setEventData, clearDraft, isHydrated } = useEventStorage()
```

## 🔄 Cómo Funciona

### Ciclo de Vida

```
1. Componente se monta
   ↓
2. useEffect([], []) restaura del localStorage
   → window.localStorage.getItem("omegon:event-draft")
   → JSON.parse() con try/catch
   → setEventData(parsed)
   → setIsHydrated(true)
   ↓
3. isHydrated = true → renderiza contenido
   ↓
4. Usuario edita un campo
   → setEventData() triggeriza el second useEffect
   ↓
5. Debounce esperando 500ms...
   (si el usuario sigue escribiendo, se reinicia el contador)
   ↓
6. Transcurridos 500ms sin cambios
   → window.localStorage.setItem("omegon:event-draft", JSON.stringify(eventData))
   ↓
7. Próxima vez que se abre la página
   → Vuelve al paso 2 ✅
```

## 🛡️ Manejo de SSR (Server-Side Rendering)

Next.js 16 renderiza en el servidor, pero `window` no existe ahí. Nuestra solución:

```tsx
// ✅ CORRECTO: Solo usar después de montar
useEffect(() => {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  // ...
}, [])

// ❌ INCORRECTO: Esto causaría error en el servidor
const stored = window.localStorage.getItem(STORAGE_KEY)
```

Además, usamos `isHydrated` para evitar renderizar hasta que los datos estén listos:

```tsx
{isHydrated ? (
  <MainContent />
) : (
  <Skeleton /> {/* mostrar placeholder */}
)}
```

## 🚀 Uso del Hook

### En cualquier componente:

```tsx
import { useEventStorage } from "@/hooks/use-event-storage"

export function MyComponent() {
  const { eventData, setEventData, clearDraft, isHydrated } = useEventStorage()

  if (!isHydrated) return <LoadingState />

  return (
    <>
      <input
        value={eventData.title}
        onChange={(e) =>
          setEventData({
            ...eventData,
            title: e.target.value,
          })
        }
      />
      <button onClick={clearDraft}>Limpiar</button>
    </>
  )
}
```

### Personalizar debounce:

```tsx
// Debounce de 1 segundo en lugar de 500ms
const { eventData, setEventData } = useEventStorage(1000)
```

## 📝 Funciones Auxiliares

### `exportEventDraft(eventData)`

Exporta el evento como JSON formateado (útil para backups).

```tsx
const json = exportEventDraft(eventData)
console.log(json) // JSON con indentación
```

### `importEventDraft(jsonString)`

Importa un evento desde JSON (con validación).

```tsx
const parsed = importEventDraft(jsonString)
if (parsed) {
  setEventData(parsed)
}
```

## 🔑 Detalles de Implementación

### Clave de Storage

```tsx
const STORAGE_KEY = "omegon:event-draft"
```

Centralizada y namespaced para evitar conflictos.

### Refs para Evitar Memory Leaks

```tsx
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
const isComponentMountedRef = useRef(true)
```

Se limpian en el return del useEffect para evitar fugas de memoria.

### Parsing Seguro

```tsx
try {
  const parsed = JSON.parse(stored) as EventData
  if (parsed.title || Object.keys(parsed).length > 0) {
    setEventData(parsed)
  }
} catch (error) {
  console.warn("Error al restaurar...", error)
  // Mantener estado por defecto si hay error
}
```

## ⚙️ Configuración

Para cambiar la **clave de storage**, editar en `hooks/use-event-storage.ts`:

```tsx
const STORAGE_KEY = "tu-nueva-clave"
```

Para cambiar el **debounce delay**, pasar como parámetro:

```tsx
const { eventData, setEventData } = useEventStorage(1000) // 1 segundo
```

## 🧪 Testing

Para limpiar el localStorage en tests:

```tsx
// Antes de cada test
beforeEach(() => {
  window.localStorage.clear()
})
```

## ✅ Checklist de Implementación

- [x] Tipos centralizados en `lib/types/event.ts`
- [x] Hook `useEventStorage` en `hooks/use-event-storage.ts`
- [x] Debounce integrado
- [x] Manejo seguro de SSR
- [x] Parsing seguro (try/catch)
- [x] TypeScript 100% tipado
- [x] Sin librerías externas
- [x] Código comentado y claro
- [x] Compatible con React 19
- [x] Funciones auxiliares (export/import)
- [x] Botón "Limpiar borrador" en la página
- [x] Skeleton mientras se restauran datos

## 🎓 Decisiones de Diseño

1. **Debounce en localStorage**: Evita escribir en cada keystroke (mejora performance).
2. **Estado `isHydrated`**: Previene SSR mismatch renderizando contenido solo cuando está listo.
3. **Refs para timers**: Garantiza limpiar timers al desmontar (evita memory leaks).
4. **Try/catch en parsing**: Si localStorage está corrupto, no rompe la app.
5. **DEFAULT_EVENT_DATA**: Un único origen para el estado inicial (DRY).
6. **Funciones auxiliares**: Permite export/import para backups o sincronización futura.

## 🔮 Mejoras Futuras (Opcionales)

- [ ] Sincronización multi-tab (usar `storage` event listener)
- [ ] Versionado de drafts (guardar historial)
- [ ] Compresión de datos (si el draft es muy grande)
- [ ] Cloud sync (Firebase, Supabase, etc.)
- [ ] Validación con Zod (ya tienes la librería)
