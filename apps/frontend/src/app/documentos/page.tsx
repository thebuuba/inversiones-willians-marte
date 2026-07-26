'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Image, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import {
  getDocuments,
  createDocument,
  deleteDocument,
  downloadDocument,
} from '@/lib/api/documents';
import type { DocumentItem } from '@inversiones/shared';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  spreadsheet: FileSpreadsheet,
  general: FileText,
};

function DocumentCard({ doc, onDelete }: { doc: DocumentItem; onDelete: (id: string) => void }) {
  const Icon = iconMap[doc.category] ?? FileText;

  return (
    <div className="flex items-center gap-4 rounded-panel border border-border-soft bg-card p-4 transition hover:bg-surface-subtle hover:shadow-soft">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">
          {doc.fileUrl ? (
            <button
              className="truncate text-left hover:underline"
              onClick={() => downloadDocument(doc.id, doc.name)}
              type="button"
            >
              {doc.name}
            </button>
          ) : (
            doc.name
          )}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {doc.category}
          {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
          {' · '}
          {new Date(doc.createdAt).toLocaleDateString('es-DO')}
        </p>
      </div>
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-state-danger-bg hover:text-state-danger"
        onClick={() => onDelete(doc.id)}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
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
      await appendDocumentUploadFiles(fd, file);
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
            className="w-full max-w-lg rounded-panel border border-border-soft bg-card p-6 shadow-modal"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Subir documento</h2>
              <button
                onClick={onClose}
                type="button"
                className="rounded-full p-1 text-text-secondary hover:bg-page"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Archivo</label>
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-control border-2 border-dashed border-primary-border p-4 text-sm text-text-secondary transition hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-primary-accent" />
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
                <label className="mb-1 block text-sm font-medium text-text-primary">Nombre</label>
                <input
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del documento"
                  value={name}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Categoría</label>
                <select
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
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
                className="flex-1 rounded-full bg-page py-2.5 text-sm font-bold text-text-secondary transition hover:bg-primary-soft"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition ${
                  file && !uploading
                    ? 'bg-primary-accent shadow-action hover:bg-primary'
                    : 'bg-text-secondary cursor-not-allowed'
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

  useEffect(() => {
    load();
  }, []);

  function handleDelete(id: string) {
    deleteDocument(id).then(load);
  }

  return (
    <div className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={load} />

      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
        initial={{ opacity: 0, y: 16 }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">ARCHIVOS</p>
          <h1 className="mt-1.5 text-3xl font-bold leading-tight text-text-primary">Documentos</h1>
          <p className="mt-1.5 text-sm text-text-secondary">Gestión documental del sistema.</p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
          onClick={() => setShowUpload(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Subir documento
        </button>
      </motion.header>

      <div className="flex h-12 items-center gap-3 rounded-full border border-primary-border bg-card px-5 text-text-secondary shadow-soft">
        <Search className="h-5 w-5 shrink-0" />
        <span className="truncate text-sm">Buscar documentos...</span>
      </div>

      <div className="mt-5 space-y-3">
        {documents.length === 0 && (
          <p className="py-12 text-center text-sm font-medium text-text-secondary">
            No hay documentos registrados
          </p>
        )}
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
