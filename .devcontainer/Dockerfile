FROM mcr.microsoft.com/devcontainers/javascript-node:20-bullseye

USER root

# Instalación de dependencias del SO y cliente de PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip zip curl postgresql-client libpq-dev \
    docker.io sudo \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Configuración de Docker Compose V2
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# Agregar usuario vscode al grupo docker para intercomunicación de sockets
RUN if id -u vscode >/dev/null 2>&1; then \
        usermod -aG docker vscode; \
    else \
        useradd -m -s /bin/bash -G docker vscode; \
    fi

# Instalación global de pnpm v9
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Directorio de trabajo
WORKDIR /workspaces

# Permisos de workspace para el usuario de desarrollo
RUN chown -R vscode:vscode /workspaces

USER vscode