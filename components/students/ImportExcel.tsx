'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as ExcelJS from 'exceljs';

interface ImportExcelProps {
  sections: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ImportExcel({ sections, onSuccess, onCancel }: ImportExcelProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'confirming'>('upload');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    sections[0]?.id || ''
  );
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Descargar plantilla Excel de ejemplo
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Estudiantes');

    sheet.columns = [
      { header: 'Nombres', key: 'firstName', width: 25 },
      { header: 'Apellidos', key: 'lastName', width: 25 },
      { header: 'Matricula', key: 'enrollmentCode', width: 20 },
    ];

    sheet.addRow({ firstName: 'Carlos José', lastName: 'Rodríguez Rosario', enrollmentCode: 'MAT-2026-001' });
    sheet.addRow({ firstName: 'María Altagracia', lastName: 'González Peña', enrollmentCode: 'MAT-2026-002' });
    sheet.addRow({ firstName: 'Luis Manuel', lastName: 'Fernández Díaz', enrollmentCode: '' });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_estudiantes_aulacontrol.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        toast.error('El archivo Excel está vacío');
        return;
      }

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltear cabecera

        const firstName = row.getCell(1).text?.toString().trim();
        const lastName = row.getCell(2).text?.toString().trim();
        const enrollmentCode = row.getCell(3).text?.toString().trim() || null;

        if (firstName && lastName) {
          rows.push({
            firstName,
            lastName,
            enrollmentCode,
          });
        }
      });

      if (rows.length === 0) {
        toast.error('No se encontraron filas con Nombres y Apellidos en la hoja');
        return;
      }

      setParsedRows(rows);
      setStep('preview');
    } catch (err: any) {
      toast.error('Error al procesar el archivo Excel. Asegúrate de que sea .xlsx');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedSectionId) {
      toast.error('Debes seleccionar una sección de destino');
      return;
    }

    try {
      setLoading(true);
      let importedCount = 0;
      let warningsCount = 0;

      for (const row of parsedRows) {
        const res = await fetch('/api/estudiantes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: row.firstName,
            lastName: row.lastName,
            enrollmentCode: row.enrollmentCode,
            sectionId: selectedSectionId,
          }),
        });

        if (res.ok) {
          importedCount++;
          const data = await res.json();
          if (data.warning) warningsCount++;
        }
      }

      toast.success(`Se importaron ${importedCount} estudiantes exitosamente.`);
      if (warningsCount > 0) {
        toast(`Atención: ${warningsCount} estudiantes tenían nombres coincidentes en el centro.`, {
          icon: '⚠️',
          duration: 6000,
        });
      }

      onSuccess();
    } catch {
      toast.error('Error al guardar estudiantes importados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Formato recomendado: columnas Nombres | Apellidos | Matrícula</span>
            <Button size="sm" variant="ghost" onClick={downloadTemplate} className="text-xs text-blue-600 flex items-center gap-1 font-semibold">
              <Download className="w-3.5 h-3.5" /> Descargar Plantilla
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Sección a la que se inscribirán los estudiantes *
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.course.name} - Sección {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50/50">
            <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-800">
              Selecciona tu archivo Excel (.xlsx)
            </p>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              La primera columna debe ser Nombres, la segunda Apellidos y la tercera Matrícula (opcional)
            </p>
            <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 mr-2" />
              Examinar archivo
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Vista previa: {parsedRows.length} estudiantes detectados
            </p>
            <Badge variant="info">Listo para importar</Badge>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase sticky top-0 border-b">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Nombres</th>
                  <th className="px-3 py-2">Apellidos</th>
                  <th className="px-3 py-2">Matrícula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-800">{r.firstName}</td>
                    <td className="px-3 py-1.5 text-gray-700">{r.lastName}</td>
                    <td className="px-3 py-1.5 text-gray-500">{r.enrollmentCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              El sistema generará un ID único irrepetible para cada estudiante. Si encuentra estudiantes con el mismo nombre y apellido en el centro, te mostrará una advertencia al finalizar.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setStep('upload')} disabled={loading}>
              Volver a cargar
            </Button>
            <Button onClick={handleConfirmImport} isLoading={loading}>
              Confirmar Importación ({parsedRows.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
