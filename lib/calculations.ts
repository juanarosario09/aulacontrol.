// lib/calculations.ts
// Reglas de negocio críticas para AulaControl (República Dominicana)

export interface ResumenEstudiante {
  studentId: string
  firstName: string
  lastName: string
  enrollmentCode?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  presentes: number
  ausentes: number
  tardanzas: number
  excusas: number
  diasTrabajados: number
  porcentaje: number | null // null si diasTrabajados === 0
}

/**
 * Calcula el porcentaje de asistencia según la regla única:
 * ASISTENCIA (%) = (Días Presentes / Días Trabajados) * 100
 * Tardanzas y Excusas NO suman a presentes.
 * Si diasTrabajados === 0, retorna null.
 */
export function calcularPorcentaje(presentes: number, diasTrabajados: number): number | null {
  if (diasTrabajados <= 0) return null
  const pct = (presentes / diasTrabajados) * 100
  return Math.min(100, Math.max(0, Math.round(pct * 100) / 100))
}

/**
 * Calcula el porcentaje acumulado anual del período escolar (agosto-junio).
 * Fórmula: (Total presentes del período / Total días trabajados del período) * 100
 * NUNCA promedio simple de porcentajes.
 */
export function calcularAcumulado(
  resumenesPorMes: { presentes: number; diasTrabajados: number }[]
): number | null {
  let totalPresentes = 0
  let totalTrabajados = 0

  for (const item of resumenesPorMes) {
    totalPresentes += item.presentes
    totalTrabajados += item.diasTrabajados
  }

  if (totalTrabajados <= 0) return null
  const pct = (totalPresentes / totalTrabajados) * 100
  return Math.min(100, Math.max(0, Math.round(pct * 100) / 100))
}

/**
 * Categorías de seguimiento sugeridas:
 * - 90-100%: Favorable (verde)
 * - 80-89%: Seguimiento (amarillo)
 * - < 80%: Atención prioritaria (rojo)
 */
export function getEstadoAsistencia(porcentaje: number | null): {
  label: string
  color: 'success' | 'warning' | 'danger' | 'neutral'
} {
  if (porcentaje === null) return { label: 'Sin datos', color: 'neutral' }
  if (porcentaje >= 90) return { label: 'Favorable', color: 'success' }
  if (porcentaje >= 80) return { label: 'Seguimiento', color: 'warning' }
  return { label: 'Atención prioritaria', color: 'danger' }
}

/**
 * Meses del año escolar dominicano (Agosto a Junio)
 */
export const MESES_ANO_ESCOLAR = [
  { numero: 8, nombre: 'Agosto' },
  { numero: 9, nombre: 'Septiembre' },
  { numero: 10, nombre: 'Octubre' },
  { numero: 11, nombre: 'Noviembre' },
  { numero: 12, nombre: 'Diciembre' },
  { numero: 1, nombre: 'Enero' },
  { numero: 2, nombre: 'Febrero' },
  { numero: 3, nombre: 'Marzo' },
  { numero: 4, nombre: 'Abril' },
  { numero: 5, nombre: 'Mayo' },
  { numero: 6, nombre: 'Junio' },
]
