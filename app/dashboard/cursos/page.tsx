'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, Plus, Users, Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CursosPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModalCourse, setOpenModalCourse] = useState(false);
  const [openModalSection, setOpenModalSection] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cursos');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: courseName.trim(), level: courseLevel.trim() }),
      });

      if (res.ok) {
        toast.success('Curso creado exitosamente');
        setCourseName('');
        setCourseLevel('');
        setOpenModalCourse(false);
        fetchCourses();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear curso');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim() || !selectedCourseId) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, name: sectionName.trim() }),
      });

      if (res.ok) {
        toast.success('Sección creada exitosamente');
        setSectionName('');
        setOpenModalSection(false);
        fetchCourses();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear sección');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mis Cursos y Secciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organiza tus grados, secciones y grupos escolares
          </p>
        </div>
        <Button onClick={() => setOpenModalCourse(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Curso / Grado
        </Button>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No tienes cursos registrados"
          description="Crea tu primer curso (por ejemplo: 1.º de Secundaria o 6.º de Primaria) y luego agrégale secciones (A, B, C)."
          action={
            <Button onClick={() => setOpenModalCourse(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear Primer Curso
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              title={course.name}
              subtitle={course.level || 'Sin nivel especificado'}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setOpenModalSection(true);
                  }}
                  className="text-xs text-blue-600 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Sección
                </Button>
              }
            >
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Secciones asignadas:
                </div>
                {course.sections.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay secciones en este curso aún.</p>
                ) : (
                  <div className="space-y-2">
                    {course.sections.map((sec: any) => {
                      const studentCount = sec.enrollments ? sec.enrollments.length : 0;
                      return (
                        <div
                          key={sec.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                              {sec.name}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              Sección {sec.name}
                            </span>
                          </div>
                          <Badge variant="neutral" size="sm" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {studentCount} {studentCount === 1 ? 'alumno' : 'alumnos'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nuevo Curso */}
      <Modal
        isOpen={openModalCourse}
        onClose={() => setOpenModalCourse(false)}
        title="Crear Nuevo Curso o Grado"
        description="Ejemplos: 1.º de Primaria, 4.º de Secundaria, etc."
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Nombre del Curso *"
            placeholder="Ej: 6.º de Primaria"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required
          />
          <Input
            label="Nivel Educativo (Opcional)"
            placeholder="Ej: Primaria o Secundaria"
            value={courseLevel}
            onChange={(e) => setCourseLevel(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenModalCourse(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Guardar Curso
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Nueva Sección */}
      <Modal
        isOpen={openModalSection}
        onClose={() => setOpenModalSection(false)}
        title="Agregar Sección al Curso"
        description="Ejemplos: A, B, C, Matutina, etc."
      >
        <form onSubmit={handleCreateSection} className="space-y-4">
          <Input
            label="Nombre o Letra de la Sección *"
            placeholder="Ej: A"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenModalSection(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Guardar Sección
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
