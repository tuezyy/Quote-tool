import React, { createContext, useContext, useEffect, useState } from 'react';

export interface BusinessConfig {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  facebookUrl: string | null;
  googleReviewUrl: string | null;
}

const DEFAULT_CONFIG: BusinessConfig = {
  name: 'Cabinets of Orlando',
  phone: '(833) 201-7849',
  email: 'info@cabinetsoforlando.com',
  website: 'https://cabinetsoforlando.com',
  city: 'Orlando',
  state: 'FL',
  address: null,
  logoUrl: null,
  primaryColor: null,
  facebookUrl: 'https://www.facebook.com/cabinetsoforlando',
  googleReviewUrl: null,
};

const BusinessContext = createContext<BusinessConfig>(DEFAULT_CONFIG);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetch('/api/public/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig({ ...DEFAULT_CONFIG, ...data }); })
      .catch(() => {}); // fallback: keep default config
  }, []);

  return (
    <BusinessContext.Provider value={config}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
