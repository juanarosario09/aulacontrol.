'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import ImportExcel from '@/components/students/ImportExcel';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Search,
  Trash2,
  Edit,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EstudiantesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');

  // Modales
  const [openNewModal, setOpenNewModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<any | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  // Traslado
  const [transferSectionId, setTransferSectionId] = useState('');

  const fetchCoursesAndSections = async () => {
    try {
      const res = await fetch('/api/cursos');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        if (data.length > 0 && data[0].sections.length > 0 && !sectionId) {
          setSectionId(data[0].sections[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filterSection) params.set('sectionId', filterSection);

      const res = await fetch(`/api/estudiantes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndSections();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, filterSection]);

  // Lista plana de todas las secciones
  const allSections = courses.flatMap((c) =>
    c.sections.map((s: any) => ({
      id: s.id,
      name: s.name,
      course: { id: c.id, name: c.name },
    }))
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !sectionId) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          enrollmentCode: enrollmentCode.trim() || null,
          sectionId,
          status,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Estudiante registrado exitosamente');
        if (data.warning) {
          toast(data.warning, { icon: '⚠️', duration: 5000 });
        }
        setFirstName('');
        setLastName('');
        setEnrollmentCode('');
        setOpenNewModal(false);
        fetchStudents();
      } else {
        toast.error(data.error || 'Error al registrar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/estudiantes/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editingStudent.firstName,
          lastName: editingStudent.lastName,
          enrollmentCode: editingStudent.enrollmentCode,
          status: editingStudent.status,
          newSectionId: transferSectionId || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Estudiante actualizado exitosamente');
        setEditingStudent(null);
        setTransferSectionId('');
        fetchStudents();
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/estudiantes/${deleteConfirmStudent.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Estudiante eliminado de la lista');
        setDeleteConfirmStudent(null);
        fetchStudents();
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Estudiantes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de matrícula, altas, traslados e importación masiva
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setOpenImportModal(true)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Importar desde Excel
          </Button>
          <Button onClick={() => setOpenNewModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Estudiante
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombres, apellidos o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las secciones</option>
            {allSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course.name} - Sección {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de estudiantes */}
      {loading ? (
        <Spinner size="lg" />
      ) : students.length === 0 ? (
        <EmptyState
          title="No se encontraron estudiantes"
          description="Agrega un estudiante manualmente o importa tu lista desde un archivo Excel."
          action={
            <Button onClick={() => setOpenNewModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar Estudiante
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Estudiante</th>
                  <th className="px-5 py-3.5">Matrícula</th>
                  <th className="px-5 py-3.5">Curso y Sección</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => {
                  const currentEnrollment = student.enrollments?.[0];
                  const sectionInfo = currentEnrollment?.section;
                  const isInactive = student.status === 'INACTIVE';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isInactive ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          ID: {student.id.slice(0, 10)}...
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {student.enrollmentCode || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {sectionInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold">
                            {sectionInfo.course?.name} - {sectionInfo.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin sección</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {student.status === 'ACTIVE' ? (
                          <Badge variant="success" size="sm">Activo</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Inactivo (En lista)</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingStudent({ ...student });
                              setTransferSectionId(sectionInfo?.id || '');
                            }}
                            title="Editar o trasladar de sección"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmStudent(student)}
                            title="Eliminar manualmente del registro"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <span>Total: <strong>{students.length}</strong> estudiantes</span>
            <span>Los estudiantes inactivos permanecen visibles hasta que se eliminen manualmente.</span>
          </div>
        </div>
      )}

      {/* Modal Nuevo Estudiante */}
      <Modal
        isOpen={openNewModal}
        onClose={() => setOpenNewModal(false)}
        title="Registrar Nuevo Estudiante"
        description="El ID del sistema se genera automáticamente."
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombres *"
              placeholder="Ej: Juan Carlos"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Apellidos *"
              placeholder="Ej: Pérez García"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Matrícula Institucional (Opcional)"
            placeholder="Ej: 2026-0045"
            value={enrollmentCode}
            onChange={(e) => setEnrollmentCode(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Curso y Sección *
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {allSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course.name} - Sección {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Estado Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenNewModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Guardar Estudiante
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar / Trasladar */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Editar Estudiante / Traslado de Sección"
        description="Los traslados conservan el historial previo intacto."
      >
        {editingStudent && (
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombres *"
                value={editingStudent.firstName}
                onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                required
              />
              <Input
                label="Apellidos *"
                value={editingStudent.lastName}
                onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Matrícula Institucional (Opcional)"
              value={editingStudent.enrollmentCode || ''}
              onChange={(e) => setEditingStudent({ ...editingStudent, enrollmentCode: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Sección (Traslado de Curso)
              </label>
              <select
                value={transferSectionId}
                onChange={(e) => setTransferSectionId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.course.name} - Sección {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Al trasladarlo, el estudiante aparecerá en la nueva sección y sus asistencias anteriores seguirán guardadas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Condición del Estudiante
              </label>
              <select
                value={editingStudent.status}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo (permanece visible en lista)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingStudent(null)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={submitting}>
                Actualizar Datos
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Importar Excel */}
      <Modal
        isOpen={openImportModal}
        onClose={() => setOpenImportModal(false)}
        title="Importar Lista de Estudiantes desde Excel"
        description="Carga masiva de estudiantes a partir de un archivo XLSX"
        maxWidth="lg"
      >
        <ImportExcel
          sections={allSections}
          onSuccess={() => {
            setOpenImportModal(false);
            fetchStudents();
          }}
          onCancel={() => setOpenImportModal(false)}
        />
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        isOpen={!!deleteConfirmStudent}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Confirmar eliminación manual"
        description="Esta acción ocultará al alumno de las listas activas."
      >
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong className="text-gray-900">
              {deleteConfirmStudent?.firstName} {deleteConfirmStudent?.lastName}
            </strong>
            ?
          </p>
          <div className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs">
            🛡️ <strong>Preservación de datos:</strong> Su historial de asistencias y calificaciones previas se mantendrá protegido en la base de datos para fines de auditoría y estadísticas pasadas.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirmStudent(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteStudent}
              isLoading={submitting}
            >
              Confirmar Eliminación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
