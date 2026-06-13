#!/bin/sh
echo "Waiting for Ollama server to start..."

# Wait for Ollama to be available by checking with ollama list
while ! ollama list >/dev/null 2>&1; do
  sleep 2
done

echo "Ollama server is up! Pulling llava-phi3 model..."
# Pull the model using the native CLI
ollama pull llava-phi3

echo "Model llava-phi3 pulled successfully. Init container exiting."
