import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # In-memory dictionary: student_id (or IP/token) -> list of timestamps
        self.requests = defaultdict(list)

    async def __call__(self, request: Request):
        # We identify the user by the "sub" claim in the JWT if available, or client host
        # But wait, we can just use the Authorization token or student ID.
        # Since this dependency is used in an endpoint that extracts the JWT,
        # it's easiest to get the user from the `estudiante` dependency if we could, 
        # or we just rely on `request.client.host` and `request.headers.get("Authorization")`.
        # To be precise, let's use the Authorization header to track the specific student token
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            client_id = request.client.host
        else:
            client_id = auth_header

        now = time.time()
        
        # Clean up old requests for this client
        history = self.requests[client_id]
        history = [ts for ts in history if now - ts < self.window_seconds]
        
        if len(history) >= self.max_requests:
            self.requests[client_id] = history
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos. Por favor espera antes de volver a intentar."
            )
            
        history.append(now)
        self.requests[client_id] = history

# Initialize a dependency instance: 5 requests per 10 seconds
attend_rate_limiter = RateLimiter(max_requests=5, window_seconds=10)
