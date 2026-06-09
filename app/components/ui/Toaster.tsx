"use client";

import { Toast } from "@heroui/react";

/**
 * Global toast portal host. Mounted once in the root layout so any client
 * component can fire `toast.success(...)` / `toast.danger(...)` — used for
 * form/server-level feedback that would otherwise shift the layout as an
 * inline Alert.
 */
export function Toaster() {
  return <Toast.Provider />;
}
