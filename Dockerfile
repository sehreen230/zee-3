# Use the official Python base image
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

WORKDIR /app

# Copy dependencies and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install playwright browsers
RUN playwright install chromium

# Copy the rest of the app code
COPY . .

# Expose the API port
EXPOSE 8000

# Start Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
