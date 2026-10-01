import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MaintenanceStatus {
  maintenance: boolean;
  message?: string;
  timestamp?: number;
}

export function useMaintenance() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkMaintenanceStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/maintenance/status');
      
      // If we get 503, maintenance is active
      if (response.status === 503) {
        const data: MaintenanceStatus = await response.json();
        setIsMaintenanceMode(true);
        
        // Redirect to maintenance page if not already there
        if (location.pathname !== '/maintenance') {
          navigate('/maintenance', { replace: true });
        }
        return;
      }

      // If we get 200, maintenance is off
      if (response.ok) {
        setIsMaintenanceMode(false);
        
        // Redirect away from maintenance page if we're there
        if (location.pathname === '/maintenance') {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      // On error, assume not in maintenance
      setIsMaintenanceMode(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkMaintenanceStatus();

    // Poll every 10 seconds
    const interval = setInterval(checkMaintenanceStatus, 10000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  return { isMaintenanceMode, isChecking };
}
