from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from core.exceptions import validation_exception_handler

# Import all 5 Domain Routers
from api.routers import (
    v1_iam, 
    v1_config, 
    v1_projects, 
    v1_issues, 
    v1_extensions
)

app = FastAPI(
    title="Enterprise Project Management API",
    description="Full-stack modular backend mirroring advanced industry standards.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://proman-aura-frontend-362935833196.asia-south1.run.app"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error Handling for Organization Users
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Register all routes to the main application
app.include_router(v1_iam.router)
app.include_router(v1_config.router)
app.include_router(v1_projects.router)
app.include_router(v1_issues.router)
app.include_router(v1_extensions.router)

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "architecture": "Domain-Driven Design Active"}