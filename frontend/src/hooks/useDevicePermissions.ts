import { useState, useEffect } from 'react';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export function useDevicePermissions() {
  const [cameraStatus, setCameraStatus] = useState<PermissionState>('prompt');
  const [geolocationStatus, setGeolocationStatus] = useState<PermissionState>('prompt');

  useEffect(() => {
    let cameraPermissionStatus: PermissionStatus | null = null;
    let geoPermissionStatus: PermissionStatus | null = null;

    const checkPermissions = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          // Check Camera
          try {
            cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraStatus(cameraPermissionStatus.state as PermissionState);
            
            cameraPermissionStatus.onchange = () => {
              setCameraStatus(cameraPermissionStatus!.state as PermissionState);
            };
          } catch (e) {
            console.warn("Camera permission query not supported or failed", e);
            setCameraStatus('unknown');
          }

          // Check Geolocation
          try {
            geoPermissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            setGeolocationStatus(geoPermissionStatus.state as PermissionState);

            geoPermissionStatus.onchange = () => {
              setGeolocationStatus(geoPermissionStatus!.state as PermissionState);
            };
          } catch (e) {
            console.warn("Geolocation permission query not supported or failed", e);
            setGeolocationStatus('unknown');
          }
        } else {
          setCameraStatus('unknown');
          setGeolocationStatus('unknown');
        }
      } catch (err) {
        console.error("Error checking permissions", err);
      }
    };

    checkPermissions();

    return () => {
      if (cameraPermissionStatus) {
        cameraPermissionStatus.onchange = null;
      }
      if (geoPermissionStatus) {
        geoPermissionStatus.onchange = null;
      }
    };
  }, []);

  return { cameraStatus, geolocationStatus };
}
