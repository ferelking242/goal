import React, { createContext, useContext, useState } from 'react';

type AdminMode = 'normal' | 'user_view' | 'god_mode';

type AdminContextType = {
  adminMode: AdminMode;
  setAdminMode: (mode: AdminMode) => void;
  isGodMode: boolean;
  isUserView: boolean;
};

const AdminContext = createContext<AdminContextType>({
  adminMode: 'normal',
  setAdminMode: () => {},
  isGodMode: false,
  isUserView: false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState<AdminMode>('normal');

  return (
    <AdminContext.Provider
      value={{
        adminMode,
        setAdminMode,
        isGodMode: adminMode === 'god_mode',
        isUserView: adminMode === 'user_view',
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
