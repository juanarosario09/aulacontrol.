# AulaControl 📚

Sistema de gestión educativa para control de asistencia, calificaciones e informes de estudiantes.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 3 |
| ORM | Prisma 5 |
| Autenticación | NextAuth v4 |
| Base de datos | PostgreSQL (SQLite en dev) |
| Correo | Resend |
| PDF | @react-pdf/renderer |
| Excel | ExcelJS |
| Formularios | React Hook Form + Zod |

## Inicio rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores

# 3. Generar el cliente Prisma y aplicar migraciones
pnpm prisma migrate dev --name init

# 4. (Opcional) Poblar la base de datos con datos de prueba
pnpm prisma db seed

# 5. Iniciar el servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

```
aulacontrol/
├── app/                  # App Router de Next.js 14
│   ├── (auth)/           # Rutas de autenticación
│   ├── (dashboard)/      # Rutas protegidas del dashboard
│   ├── api/              # API Routes
│   ├── layout.tsx        # Layout raíz
│   └── globals.css       # Estilos globales
├── components/           # Componentes React reutilizables
│   ├── ui/               # Componentes base (Button, Input…)
│   └── ...
├── lib/                  # Utilidades y configuración
│   ├── prisma.ts         # Cliente Prisma singleton
│   └── utils.ts          # Funciones de utilidad
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
├── types/
│   └── index.ts          # Tipos e interfaces globales
└── ...
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Iniciar en producción |
| `pnpm lint` | Linter ESLint |
| `pnpm prisma studio` | GUI de base de datos |
| `pnpm prisma migrate dev` | Crear migración |

## Roles de usuario

- **ADMIN** — Acceso completo: gestión de usuarios, cursos y configuración.
- **TEACHER** — Registro de asistencia y calificaciones de sus cursos asignados.

## Licencia

MIT
