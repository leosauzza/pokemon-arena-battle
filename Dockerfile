FROM python:3.11-alpine

WORKDIR /app

# Copy all project files
COPY . .

# Expose the port the server runs on
EXPOSE 8123

# Set host to 0.0.0.0 to allow external connections in Docker
ENV HOST=0.0.0.0
ENV PORT=8123

# Run the server
CMD ["python3", "server.py"]
