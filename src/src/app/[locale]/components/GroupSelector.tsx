"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GroupAPIService } from "@/services/groupService";
import { Group } from "@/types/groups";

interface GroupSelectorProps {
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  loadingText?: string;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedIds,
  onChange,
  id = "allowed_groups",
  label,
  placeholder = "Selecciona un grupo...",
  loadingText = "Cargando grupos...",
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await GroupAPIService.getGroups();
        if (res.success) {
          setGroups(res.data);
          setAvailableGroups(
            res.data.filter((g: Group) => !!g._id && !selectedIds.includes(g._id!))
          );
        }
      } catch (e) {
        console.error("Error loading groups:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Update available when selectedIds change
  useEffect(() => {
    setAvailableGroups((prev) => {
      // Recompute from full groups list to keep ordering consistent
      return groups.filter((g) => !!g._id && !selectedIds.includes(g._id!));
    });
  }, [selectedIds, groups]);

  const handleAdd = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (!val) return;
      onChange([...selectedIds, val]);
      // reset select
      try {
        (e.target as HTMLSelectElement).value = "";
      } catch (_) {}
    },
    [onChange, selectedIds]
  );

  const handleRemove = useCallback(
    (idToRemove: string) => {
      onChange(selectedIds.filter((s) => s !== idToRemove));
    },
    [onChange, selectedIds]
  );

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#283618]/70 mb-2">
          {label}
        </label>
      )}

      <div className="space-y-2">
        <select
          id={id}
          value={""}
          onChange={handleAdd}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{placeholder}</option>
          {loading ? (
            <option disabled>{loadingText}</option>
          ) : (
            availableGroups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.group_name}
              </option>
            ))
          )}
        </select>

        <div className="mt-2 mb-2 flex flex-wrap gap-2">
          {selectedIds.map((idSel) => {
            const grp = groups.find((g) => g._id === idSel);
            return (
              <span key={idSel} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1">
                <span className="mr-2">{grp ? grp.group_name : idSel}</span>
                <button
                  type="button"
                  aria-label={`Eliminar ${grp ? grp.group_name : idSel}`}
                  onClick={() => handleRemove(idSel)}
                  className="rounded-full hover:bg-blue-200 px-2"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
