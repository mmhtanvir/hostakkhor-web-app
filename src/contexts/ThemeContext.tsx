import React, { createContext, useContext, useEffect, useState } from 'react';
import tenants from '../config/tenants.json';

interface ThemeConfig {
  name: string;
  themesDirPath: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  showHeaderSearch?: boolean;
  allowVideoUpload?: boolean;
  authBackgroundImage?: string;
  tenantLogoImage?: string;
  bannerImage?: string;
  createNewPostPlaceholdertext?: string;
  allowTextBeforeAttachment?: boolean;
  afterAttachmentPlaceholderText?: string;
  aboutUsLink?: string;
  navigation: {
    home: boolean;
    communities: boolean;
    messages: boolean;
    notifications: boolean;
    profile: boolean;
  };
}

interface ThemeContextType {
  theme: ThemeConfig;
  tenant: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [tenant, setTenant] = useState<string>('');

  useEffect(() => {
    // Get tenant from environment variable
    const currentTenant = import.meta.env.VITE_TENANT || 'skyharvest';
    setTenant(currentTenant);

    // Load theme configuration based on tenant
    const tenantConfig = tenants[currentTenant as keyof typeof tenants];
    if (tenantConfig) {
      setThemeConfig(tenantConfig);
      
      // Load CSS theme file
      // const link = document.createElement('link');
      // link.rel = 'stylesheet';
      // link.href = `/${tenantConfig.theme}`;
      // document.head.appendChild(link);

      // // Clean up function to remove the style when component unmounts
      // return () => {
      //   document.head.removeChild(link);
      // };
    }
  }, []);

  if (!themeConfig) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme: themeConfig, tenant }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
