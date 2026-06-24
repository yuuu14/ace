"use client";

import { useEffect } from "react";

import CapabilityCard from "@/components/CapabilityCard";
import CodeInspector from "@/components/CodeInspector";
import { useAceStore } from "@/store/useAceStore";
import { listCapabilities, getCapability } from "@/lib/api";

export default function CapabilityRegistry() {
  const { capabilities, selectedCapability, setCapabilities, setSelectedCapability } = useAceStore();

  useEffect(() => {
    listCapabilities()
      .then(setCapabilities)
      .catch((err) => console.error("Failed to load capabilities:", err));
  }, [setCapabilities]);

  const handleSelect = async (id: string) => {
    if (selectedCapability?.id === id) {
      setSelectedCapability(null);
      return;
    }
    try {
      const cap = await getCapability(id);
      setSelectedCapability(cap);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ace-muted">
        Capability Registry
      </h2>
      <div className="space-y-3">
        {capabilities.map((cap) => (
          <CapabilityCard
            key={cap.id}
            capability={cap}
            selected={selectedCapability?.id === cap.id}
            onClick={() => handleSelect(cap.id)}
          />
        ))}
      </div>
      {selectedCapability && <CodeInspector capability={selectedCapability} />}
    </div>
  );
}
