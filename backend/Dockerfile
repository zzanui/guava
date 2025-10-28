FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    # WeasyPrint
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libglib2.0-0 libffi-dev \
    fonts-dejavu-core fonts-liberation fonts-noto-color-emoji \
    # (옵션) OpenCV 런타임
    libgl1 libsm6 libxext6 libxrender1 \
    # (옵션) PyAudio 빌드/런타임
    portaudio19-dev libasound2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt

COPY . .
