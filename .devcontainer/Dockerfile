FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

USER root

# Instalación de dependencias del SO y cliente de PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip zip curl postgresql-client libpq-dev \
    docker.io sudo \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# 🚀 ACTUALIZADO: Configuración de Docker Compose V2 a su última versión estable (v2.32.4)
RUN curl -SL https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# Agregar usuario vscode al grupo docker para intercomunicación de sockets
RUN if id -u vscode >/dev/null 2>&1; then \
        usermod -aG docker vscode; \
    else \
        useradd -m -s /bin/bash -G docker vscode; \
    fi

# 🚀 ACTUALIZADO: Corepack listo con soporte nativo para la última versión estable de pnpm v9 (v9.15.4)
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# 🔒 [BLOQUEO SEGURIDAD]: Desactivar npm y npx tradicionales para evitar ejecuciones accidentales o maliciosas
RUN rm -f /usr/local/bin/npm /usr/local/bin/npx \
    && echo '#!/bin/bash\necho "❌ El uso de npm/npx está prohibido en este contenedor por seguridad. Usa pnpm o pnpm dlx."' > /usr/local/bin/npm \
    && echo '#!/bin/bash\necho "❌ El uso de npm/npx está prohibido en este contenedor por seguridad. Usa pnpm o pnpm dlx."' > /usr/local/bin/npx \
    && chmod +x /usr/local/bin/npm /usr/local/bin/npx

# Directorio de trabajo
WORKDIR /workspaces

# Permisos de workspace para el usuario de desarrollo
RUN chown -R vscode:vscode /workspaces

USER vscode

# 🔒 Configurar pnpm para que ignore scripts de ciclo de vida maliciosos por defecto al instalar paquetes externos
RUN pnpm config set ignore-scripts true