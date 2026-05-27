'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  Image,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { getDocuments, deleteDocument } from '@/lib/api/documents';
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
        <p className="truncate text-sm font-bold text-[#173D2C]">{doc.name}</p>
        <p className="mt-0.5 text-xs text-[#A9CDBB]">{doc.category} · {new Date(doc.createdAt).toLocaleDateString('es-DO')}</p>
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

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    getDocuments().then(setDocuments);
  }, []);

  function handleDelete(id: string) {
    deleteDocument(id).then(() => setDocuments((prev) => prev.filter((d) => d.id !== id)));
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
        initial={{ opacity: 0, y: 16 }}
      >
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">Documentos</h1>
          <p className="mt-1.5 text-sm text-[#7E9086]">Gestión documental del sistema.</p>
        </div>
        <button className="flex h-11 items-center gap-2 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:-translate-y-0.5">
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
