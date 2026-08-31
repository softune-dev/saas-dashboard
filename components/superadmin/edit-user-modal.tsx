"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import type { SuperAdminUser } from "@/lib/api/superadmin";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];

type EditUserModalProps = {
  open: boolean;
  user: SuperAdminUser | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (data: {
    role: SuperAdminUser["role"];
    is_active: boolean;
    is_superadmin: boolean;
    new_password?: string;
  }) => void;
};

export function EditUserModal({
  open,
  user,
  busy,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [role, setRole] = useState<SuperAdminUser["role"]>("member");
  const [isActive, setIsActive] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setIsActive(user.is_active);
      setIsSuperadmin(user.is_superadmin);
      setNewPassword("");
    }
  }, [open, user]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      role,
      is_active: isActive,
      is_superadmin: isSuperadmin,
      ...(newPassword.length >= 8 ? { new_password: newPassword } : {}),
    });
  }

  return (
    <FormModal
      open={open}
      title={user ? `Edit ${user.email}` : "Edit user"}
      busy={busy}
      submitLabel="Save"
      compact
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <SettingsSelect
          label="Role"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(e) =>
            setRole(e.target.value as SuperAdminUser["role"])
          }
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-slate-300 accent-primary"
          />
          Active
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isSuperadmin}
            onChange={(e) => setIsSuperadmin(e.target.checked)}
            className="size-4 rounded border-slate-300 accent-primary"
          />
          Superadmin
        </label>
        <SettingsInput
          label="Reset password"
          type="password"
          minLength={8}
          hint="Leave blank to keep the current password."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
    </FormModal>
  );
}
