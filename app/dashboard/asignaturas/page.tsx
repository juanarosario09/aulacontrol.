'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookmarkCheck, Plus, Trash2, Archive, ArchiveRestore, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AsignaturasPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal confirmación eliminar
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<any | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/asignaturas');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch {
      toast.error('Error al cargar asignaturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/asignaturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (res.ok) {
        toast.success('Asignatura creada');
        setName('');
        setDescription('');
        setOpenModal(false);
        fetchSubjects();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (subject: any) => {
    try {
      const res = await fetch(`/api/asignaturas/${subject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !subject.isArchived }),
      });
      if (res.ok) {
        toast.success(subject.isArchived ? 'Asignatura reactivada' : 'Asignatura archivada');
        fetchSubjects();
      }
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmSubject) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/asignaturas/${deleteConfirmSubject.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Asignatura eliminada');
        setDeleteConfirmSubject(null);
        fetchSubjects();
      } else {
        // Si tiene asistencias, el servidor responde con 400 y mensaje
        toast.error(data.error, { duration: 5000 });
      }
    } catch {
      toast.error('Error al procesar eliminación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Asignaturas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Materias curriculares registradas para control de asistencia
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Asignatura
        </Button>
      </div>

      <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Regla de seguridad:</strong> Las asignaturas que ya cuenten con asistencias registradas no pueden ser eliminadas para proteger el historial académico de los estudiantes. En su lugar, puede archivarlas para que no aparezcan activas.
        </p>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No hay asignaturas registradas"
          description="Agrega tus materias como Matemática, Lengua Española, Ciencias de la Naturaleza, etc."
          action={
            <Button onClick={() => setOpenModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear Asignatura
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const sessionsCount = sub._count?.classSessions || 0;
            return (
              <div
                key={sub.id}
                className={`p-5 rounded-xl border bg-white shadow-sm transition-all ${
                  sub.isArchived ? 'opacity-60 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{sub.name}</h3>
                    {sub.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                    )}
                  </div>
                  {sub.isArchived ? (
                    <Badge variant="warning" size="sm">Archivada</Badge>
                  ) : (
                    <Badge variant="success" size="sm">Activa</Badge>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    <strong>{sessionsCount}</strong> {sessionsCount === 1 ? 'clase registrada' : 'clases registradas'}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleArchive(sub)}
                      title={sub.isArchived ? 'Reactivar asignatura' : 'Archivar asignatura'}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {sub.isArchived ? (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmSubject(sub)}
                      title="Eliminar si está en blanco"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Nueva Asignatura"
        description="Ingresa el nombre de la materia escolar"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre de la Asignatura *"
            placeholder="Ej: Matemática, Lengua Española"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Descripción o Código (Opcional)"
            placeholder="Ej: MAT-101 o Turno matutino"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Guardar Asignatura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación Borrar */}
      <Modal
        isOpen={!!deleteConfirmSubject}
        onClose={() => setDeleteConfirmSubject(null)}
        title="Confirmar eliminación"
        description="¿Estás seguro de que deseas eliminar esta asignatura?"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Asignatura: <strong className="text-gray-900">{deleteConfirmSubject?.name}</strong>
          </p>
          {deleteConfirmSubject?._count?.classSessions > 0 ? (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">
              ⚠️ Esta asignatura tiene {deleteConfirmSubject._count.classSessions} clases registradas. El sistema bloqueará la eliminación para no dañar el historial de los estudiantes. Debe archivarla.
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Esta asignatura no tiene asistencias asociadas. Se eliminará permanentemente.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirmSubject(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={submitting}
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
