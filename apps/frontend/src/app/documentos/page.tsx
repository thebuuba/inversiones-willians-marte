'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Image,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getDocuments, createDocument, deleteDocument, downloadDocument } from '@/lib/api/documents';
import type { DocumentItem } from '@inversiones/shared';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  spreadsheet: FileSpreadsheet,
  general: FileText,
};

function DocumentCard({ doc, onDelete }: { doc: DocumentItem; onDelete: (id: string) => void }) {
  const Icon = iconMap[doc.category] ?? FileText;

  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[#DDEBE3] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(40,92,67,0.06)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F4EC] text-[#5FA37D]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#173D2C]">
          {doc.fileUrl ? (
            <button className="truncate text-left hover:underline" onClick={() => downloadDocument(doc.id, doc.name)} type="button">
              {doc.name}
            </button>
          ) : (
            doc.name
          )}
        </p>
        <p className="mt-0.5 text-xs text-[#A9CDBB]">
          {doc.category}
          {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
          {' · '}
          {new Date(doc.createdAt).toLocaleDateString('es-DO')}
        </p>
      </div>
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#A9CDBB] transition hover:bg-[#FFE8D8] hover:text-[#C96F4A]"
        onClick={() => onDelete(doc.id)}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name || file.name);
      fd.append('category', category);
      await createDocument(fd);
      onUploaded();
      onClose();
      setName('');
      setCategory('general');
      setFile(null);
    } catch {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-xl"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#173D2C]">Subir documento</h2>
              <button onClick={onClose} type="button" className="rounded-full p-1 text-[#A9CDBB] hover:bg-[#F3F4F6]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#173D2C]">Archivo</label>
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-[12px] border-2 border-dashed border-[#DDEBE3] p-4 text-sm text-[#7E9086] transition hover:border-[#285C43]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-[#5FA37D]" />
                  {file ? file.name : 'Haz clic para seleccionar un archivo'}
                </div>
                <input
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  type="file"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#173D2C]">Nombre</label>
                <input
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del documento"
                  value={name}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#173D2C]">Categoría</label>
                <select
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setCategory(e.target.value)}
                  value={category}
                >
                  <option value="general">General</option>
                  <option value="identificacion">Identificación</option>
                  <option value="contrato">Contrato</option>
                  <option value="comprobante">Comprobante</option>
                  <option value="estado_cuenta">Estado de Cuenta</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full bg-[#F3F4F6] py-2.5 text-sm font-bold text-[#7E9086] transition hover:bg-[#E7F4EC]"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition ${
                  file && !uploading
                    ? 'bg-[#285C43] shadow-[0_8px_16px_rgba(40,92,67,0.22)] hover:-translate-y-0.5'
                    : 'bg-[#A9CDBB] cursor-not-allowed'
                }`}
                disabled={!file || uploading}
                type="submit"
              >
                {uploading ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  function load() {
    getDocuments().then(setDocuments);
  }

  useEffect(() => { load(); }, []);

  function handleDelete(id: string) {
    deleteDocument(id).then(load);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={load} />

      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
        initial={{ opacity: 0, y: 16 }}
      >
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">Documentos</h1>
          <p className="mt-1.5 text-sm text-[#7E9086]">Gestión documental del sistema.</p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:-translate-y-0.5"
          onClick={() => setShowUpload(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Subir documento
        </button>
      </motion.header>

      <div className="flex h-12 items-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-5 text-[#A9CDBB] shadow-[0_7px_22px_rgba(40,92,67,0.035)]">
        <Search className="h-5 w-5 shrink-0" />
        <span className="truncate text-sm">Buscar documentos...</span>
      </div>

      <div className="mt-5 space-y-3">
        {documents.length === 0 && (
          <p className="py-12 text-center text-sm font-medium text-[#A9CDBB]">No hay documentos registrados</p>
        )}
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
