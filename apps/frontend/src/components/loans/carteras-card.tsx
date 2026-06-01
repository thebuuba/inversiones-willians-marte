'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import { FolderOpen, Palette, Plus, Check, X } from 'lucide-react';
import { getPortfolios, createPortfolio, type PortfolioItem } from '@/lib/api/portfolios';

const PRESET_COLORS = [
  '#5FA37D', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export function CarterasCard({
  selectedPortfolioId,
  onSelectPortfolio,
}: {
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string | null) => void;
}) {
  const [active, setActive] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name || name.length < 2) return;
    setSaving(true);
    setError('');
    try {
      const created = await createPortfolio({ name, color: newColor });
      setPortfolios((prev) => [created, ...prev]);
      onSelectPortfolio(created.id);
      setCreating(false);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; message?: string | string[] }>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        'Error al crear cartera';
      setError(Array.isArray(message) ? message.join(' ') : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#E7F4EC] px-3 py-1.5 text-sm font-bold text-[#2F7654] shadow-sm">
        <FolderOpen className="h-4 w-4" />
        Carteras
      </span>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-100 bg-white p-4 pt-6 shadow-sm lg:p-5 lg:pt-7"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        <label className="mb-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#DDEBE3] text-[#2F7654] accent-[#2F7654]"
            checked={active}
            onChange={() => {
              if (active) {
                onSelectPortfolio(null);
                setActive(false);
              } else {
                setActive(true);
                setLoading(true);
                getPortfolios()
                  .then(setPortfolios)
                  .catch((err) => {
                    const axiosError = err as AxiosError<{ error?: string }>;
                    setError(axiosError.response?.data?.error ?? 'Error al cargar carteras');
                  })
                  .finally(() => setLoading(false));
              }
            }}
          />
          <span className="text-xs font-bold text-[#6F8076]">Asignar a cartera</span>
        </label>

        {active && (
          <>
            {error && (
              <p className="mb-3 rounded-lg border border-[#F1C9B7] bg-[#FFF4EE] px-3 py-2 text-xs font-medium text-[#B45B38]">
                {error}
            </p>
            )}

            {loading ? (
              <p className="text-xs text-[#7A8A80]">Cargando carteras...</p>
            ) : creating ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Nombre</span>
                  <input
                    ref={inputRef}
                    className="h-[38px] w-full rounded-[8px] border border-[#DDEBE3] bg-white px-3 text-sm font-medium text-[#173D2C] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
                    placeholder="Ej. Cartera Personal"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                  />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Color</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[#DDEBE3] bg-white"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      type="button"
                    >
                      <Palette className="h-4 w-4 text-[#7A8A80]" />
                    </button>
                    <span className="h-[28px] w-[28px] rounded-md border border-[#DDEBE3]" style={{ backgroundColor: newColor }} />
                    <span className="text-xs text-[#7A8A80]">{newColor}</span>
                  </div>
                  {showColorPicker && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`h-[28px] w-[28px] rounded-full border-2 transition ${
                            newColor === color ? 'border-[#173D2C] scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => { setNewColor(color); setShowColorPicker(false); }}
                          type="button"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2F7654] text-xs font-bold text-white transition hover:bg-[#285C43] disabled:opacity-50"
                    disabled={newName.trim().length < 2 || saving}
                    onClick={handleCreate}
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {saving ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDEBE3] text-[#7A8A80] transition hover:bg-[#F3FAF6]"
                    onClick={() => setCreating(false)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {portfolios.length === 0 ? (
                  <p className="text-xs text-[#7A8A80]">No hay carteras creadas</p>
                ) : (
                  portfolios.map((p) => (
                    <button
                      key={p.id}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                        selectedPortfolioId === p.id
                          ? 'border-[#5FA37D] bg-[#EAF6EF]'
                          : 'border-[#EDF2EF] hover:bg-[#F8FBF9]'
                      }`}
                      onClick={() => onSelectPortfolio(selectedPortfolioId === p.id ? null : p.id)}
                      type="button"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#173D2C]">{p.name}</p>
                        {p.description && (
                          <p className="mt-0.5 truncate text-xs text-[#7A8A80]">{p.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-medium text-[#7A8A80]">{p._count.loans}</span>
                      {selectedPortfolioId === p.id && (
                        <Check className="h-4 w-4 shrink-0 text-[#5FA37D]" />
                      )}
                    </button>
                  ))
                )}
                <button
                  className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#DDEBE3] text-xs font-bold text-[#5FA37D] transition hover:bg-[#F3FAF6]"
                  onClick={() => { setCreating(true); setError(''); }}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva cartera
                </button>
              </div>
            )}
          </>
        )}
      </motion.section>
    </div>
  );
}
