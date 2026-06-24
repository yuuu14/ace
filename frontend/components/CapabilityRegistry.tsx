"use client";

import { useMemo } from "react";

import CapabilityCard from "@/components/CapabilityCard";
import CodeInspector from "@/components/CodeInspector";
import { useAceStore } from "@/store/useAceStore";

export default function CapabilityRegistry() {
  const {
    capabilities,
    selectedCapability,
    loading,
    error,
    filterCategory,
    searchQuery,
    setSelectedCapability,
    fetchSelectedCapability,
    setFilterCategory,
    setSearchQuery,
  } = useAceStore();

  const allCategories = useMemo(
    () => Array.from(new Set(capabilities.map((c) => c.category))),
    [capabilities],
  );

  const filtered = useMemo(() => {
    let list = capabilities;
    if (filterCategory) list = list.filter((c) => c.category === filterCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.objective.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [capabilities, filterCategory, searchQuery]);

  const totalRuns = filtered.reduce((sum, c) => sum + c.sample_runs_analyzed, 0);

  const handleSelect = async (id: string) => {
    if (selectedCapability?.id === id) {
      setSelectedCapability(null);
      return;
    }
    await fetchSelectedCapability(id);
  };

  return (
    <div className="glass flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ace-muted">
            Capability Registry
          </h2>
          <span className="rounded border border-ace-border px-2 py-0.5 text-[10px] text-ace-cyan">
            {filtered.length} packs
          </span>
        </div>

        {/* Summary stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded border border-ace-border bg-black/30 px-2 py-1.5">
            <div className="text-zinc-500">Categories</div>
            <div className="truncate text-zinc-200">
              {allCategories.join(", ") || "—"}
            </div>
          </div>
          <div className="rounded border border-ace-border bg-black/30 px-2 py-1.5">
            <div className="text-zinc-500">Audited Runs</div>
            <div className="text-zinc-200">{totalRuns}</div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search by name, ID, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search capabilities"
            className="w-full rounded border border-ace-border bg-black/40 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-ace-cyan"
          />
        </div>

        {/* Category filter chips */}
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          <button
            onClick={() => setFilterCategory(null)}
            className={`rounded border px-2 py-0.5 text-[10px] transition ${
              filterCategory === null
                ? "border-ace-cyan bg-ace-cyan/10 text-ace-cyan"
                : "border-ace-border bg-black/30 text-zinc-500 hover:border-zinc-600"
            }`}
            aria-pressed={filterCategory === null}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className={`rounded border px-2 py-0.5 text-[10px] transition ${
                filterCategory === cat
                  ? "border-ace-cyan bg-ace-cyan/10 text-ace-cyan"
                  : "border-ace-border bg-black/30 text-zinc-500 hover:border-zinc-600"
              }`}
              aria-pressed={filterCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error / Content */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading.capabilities && capabilities.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center" role="status" aria-label="Loading capabilities">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-ace-cyan border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-xs text-ace-muted">Loading capability packs…</p>
          </div>
        )}

        {error.capabilities && (
          <div
            className="rounded border border-rose-400/30 bg-rose-500/10 p-3 text-center text-xs text-ace-rose"
            role="alert"
          >
            {error.capabilities}
          </div>
        )}

        {!loading.capabilities && !error.capabilities && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-ace-muted">
              {capabilities.length === 0
                ? "No capability packs available."
                : "No packs match your filter."}
            </p>
          </div>
        )}

        {filtered.map((cap) => (
          <div key={cap.id} className="min-w-0 space-y-2">
            <CapabilityCard
              capability={cap}
              selected={selectedCapability?.id === cap.id}
              onClick={() => handleSelect(cap.id)}
            />
            {selectedCapability?.id === cap.id && (
              <CodeInspector capability={selectedCapability} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
