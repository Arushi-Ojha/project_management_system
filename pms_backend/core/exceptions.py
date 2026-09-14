from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Translates technical 422 Validation Errors into human-readable instructions.
    """
    errors = exc.errors()
    simplified_errors = []
    
    for error in errors:
        # Extract the specific field that failed validation
        field = error["loc"][-1] if len(error["loc"]) > 0 else "unknown_field"
        error_type = error["type"]
        
        # Translate technical errors into actionable guidance
        if error_type == "missing":
            msg = f"The '{field}' field is missing. This is a required field."
        elif error_type == "string_too_short":
            msg = f"The '{field}' provided is too short. Please provide a longer value."
        elif error_type == "value_error.email":
            msg = f"The '{field}' must be a valid email format (e.g., user@company.com)."
        elif error_type == "enum":
            allowed_values = error.get("ctx", {}).get("enum_values", [])
            msg = f"Invalid entry for '{field}'. Allowed values are: {', '.join([str(v) for v in allowed_values])}."
        elif "uuid" in error_type:
            msg = f"The '{field}' must be a valid UUID format."
        else:
            msg = error.get("msg", "Invalid value provided.")
            
        simplified_errors.append({"field": field, "instruction": msg})

    return JSONResponse(
        status_code=422,
        content={
            "error": "Unprocessable Entity",
            "message": "The request payload contains invalid data. Please review the details below.",
            "details": simplified_errors
        }
    )