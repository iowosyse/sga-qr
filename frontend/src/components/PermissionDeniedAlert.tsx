import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { CameraOff, MapPinOff } from "lucide-react";
import { PermissionState } from "@/hooks/useDevicePermissions";

interface PermissionDeniedAlertProps {
  status: PermissionState;
  type: 'camera' | 'geolocation';
}

export function PermissionDeniedAlert({ status, type }: PermissionDeniedAlertProps) {
  if (status !== 'denied') {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      {type === 'camera' ? <CameraOff className="h-4 w-4" /> : <MapPinOff className="h-4 w-4" />}
      <AlertTitle>Acceso Denegado</AlertTitle>
      <AlertDescription>
        {type === 'camera' 
          ? "Necesitamos acceso a tu cámara para escanear el código del docente. Por favor, concédelo en los ajustes de tu navegador." 
          : "Para validar tu asistencia debes estar dentro del aula. Por favor, activa el acceso a la ubicación GPS en tu dispositivo."}
      </AlertDescription>
    </Alert>
  );
}
