import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PermissionDeniedAlert } from './PermissionDeniedAlert';
import '@testing-library/jest-dom';

describe('PermissionDeniedAlert', () => {
  it('should not render anything when status is granted or prompt', () => {
    const { container, rerender } = render(<PermissionDeniedAlert status="granted" type="camera" />);
    expect(container.firstChild).toBeNull();

    rerender(<PermissionDeniedAlert status="prompt" type="camera" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render camera error message when camera is denied', () => {
    render(<PermissionDeniedAlert status="denied" type="camera" />);
    expect(screen.getByText(/Necesitamos acceso a tu cámara para escanear/i)).toBeInTheDocument();
  });

  it('should render location error message when location is denied', () => {
    render(<PermissionDeniedAlert status="denied" type="geolocation" />);
    expect(screen.getByText(/Para validar tu asistencia debes estar dentro del aula/i)).toBeInTheDocument();
  });
});
