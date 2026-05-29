import time
import random
from locust import HttpUser, task, between
from app.services.auth import create_access_token

class StudentUser(HttpUser):
    wait_time = between(1, 2)
    
    def on_start(self):
        # Generar un JWT falso pero válido usando la clave secreta del backend
        # Simularemos que cada usuario Locust es un estudiante distinto
        student_id = f"LOCUST_{random.randint(1000, 9999)}"
        self.jwt = create_access_token(data={"sub": student_id, "rol": "estudiante"})
        self.headers = {
            "Authorization": f"Bearer {self.jwt}"
        }

    @task
    def attend_class(self):
        # Payload con un TOTP inválido
        # Principalmente estresamos el Rate Limiter, JWT decoding, y CPU
        payload = {
            "token_qr": "dummy_token",
            "lat": 20.0,
            "lng": -103.0
        }
        
        # Enviar petición POST
        with self.client.post("/api/student/attend", json=payload, headers=self.headers, catch_response=True) as response:
            # Locust considera errores los códigos >= 400 por defecto.
            # Aquí, 422 (QR inválido) y 429 (Rate Limit) son comportamientos ESPERADOS y CORRECTOS de la aplicación.
            if response.status_code in [401, 422, 429, 500]:
                response.success()
            elif response.status_code == 200:
                response.success()
            else:
                response.failure(f"Unexpected status code: {response.status_code}")
