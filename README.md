# 🐾 Pet Alert Frontend

Frontend de Pet Alert construido con **Angular 19** y **Tailwind CSS**.

---

## 📁 Estructura del proyecto

```
pet-alert-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── shared/
│   │   ├── features/
│   │   └── layout/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── .env.example
├── angular.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🧩 Arquitectura de la app

La app está dividida en cuatro módulos con responsabilidades bien definidas. La regla general es: **cada cosa vive en el lugar más específico posible**.

---

### `core/` — Servicios y lógica global

Todo lo que es **singleton y se usa en toda la app** vive acá. Se importa una sola vez en el `app.config.ts` y no se repite en ningún otro módulo.

```
core/
  guards/
    auth.guard.ts          # Protege rutas que requieren autenticación
    __tests__/
  interceptors/
    auth.interceptor.ts    # Agrega el token JWT a cada request HTTP
    error.interceptor.ts   # Maneja errores globales de la API (401, 500, etc)
  services/
    auth.service.ts        # Maneja login, logout y estado de la sesión
    __tests__/
```

**Regla:** si un servicio o guard lo usan dos o más features, va en `core/`. Si lo usa una sola feature, va dentro de esa feature.

---

### `shared/` — Componentes reutilizables

Todo lo que es **UI genérica y reutilizable entre features** vive acá. No tiene lógica de negocio — solo presentación.

```
shared/
  components/
    button/     # Botón con variantes (primary, secondary, danger)
    input/      # Input con validación y estilos consistentes
    modal/      # Modal genérico reutilizable
  pipes/        # Pipes de transformación (fechas, texto, etc)
  directives/   # Directivas personalizadas
```

**Regla:** si un componente aparece en más de una feature, va en `shared/`. Si solo lo usa una feature, va dentro de esa feature.

---

### `features/` — Módulos por funcionalidad

Cada feature es un **módulo independiente con lazy loading**. No se conocen entre sí — solo consumen de `core/` y `shared/`. Cada feature tiene sus propios componentes, servicios y tests.

```
features/
  auth/
    login/
      login.component.ts      # Formulario de login
      login.component.html
      __tests__/
    register/                 # Formulario de registro

  pets/
    lost-pet/                 # Reportar mascota perdida
    found-pet/                # Reportar mascota encontrada
    pet-detail/               # Detalle de una mascota
    services/
      pet.service.ts          # Llama a la API de mascotas

  matches/
    match-list/               # Lista de posibles matches
    match-detail/             # Detalle de un match
    services/
      match.service.ts        # Llama a la API de matches
```

**Regla:** todo lo que pertenece exclusivamente a una feature vive dentro de ella — componentes, servicios y tests. Esto permite que si en el futuro se elimina una feature, se borra una sola carpeta.

---

### `layout/` — Shell de la aplicación

Los componentes que forman el **esqueleto visual de la app** — lo que se ve siempre independientemente de la ruta.

```
layout/
  navbar/     # Barra de navegación superior
  sidebar/    # Menú lateral (si aplica)
  footer/     # Pie de página
```

---

## ⚙️ Variables de entorno

```
environments/
  environment.ts       # Valores para desarrollo local
  environment.prod.ts  # Valores para producción
```

En el código siempre importás `environment.ts`. Angular se encarga de usar el de producción cuando corresponde.

```typescript
import { environment } from '../environments/environment';

const url = environment.apiUrl;
```

Copiá el `.env.example` para arrancar:

```bash
cp .env.example .env
```

---

## 🧪 Testing

Los tests viven en carpetas `__tests__/` dentro de la carpeta que testean:

```
guards/
  auth.guard.ts
  __tests__/
    auth.guard.spec.ts
```

Hay dos niveles de tests:

**Unitarios** — testean componentes, servicios y guards de forma aislada mockeando las dependencias externas (HTTP, router, etc).

**Integración** — testean flujos completos dentro de una feature (formulario → servicio → respuesta).

> ⚠️ Pendiente de configurar: Vitest + Angular Testing Library en reemplazo de Karma.

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` o `ng serve` | Levanta la app en modo desarrollo |
| `npm run build` o `ng build` | Compila la app para producción |
| `npm test` | Corre los tests |

---

## 🔑 Reglas del proyecto

- **Lazy loading en todas las features** — ninguna feature se carga en el bundle inicial, solo cuando el usuario navega a esa ruta.
- **Los servicios específicos van dentro de su feature** — solo los globales van en `core/`.
- **Los componentes genéricos van en `shared/`** — si un componente tiene lógica de negocio de una feature específica, no es genérico.
- **`core/` se importa una sola vez** — nunca importar módulos de `core/` dentro de una feature.
- **Nunca importar entre features** — si dos features necesitan algo en común, ese algo va en `shared/` o `core/`.

---

## 🔗 Conexión con el backend

La URL de la API se configura en `environments/`:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://tu-api.railway.app/api'
};
```

> ⚠️ Pendiente de configurar: Tailwind CSS.