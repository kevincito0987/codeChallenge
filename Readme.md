# 🐦 Birdie - Twitter/X Full-Stack Clone

## 1. Overview
**Birdie** es una plataforma web full-stack que replica las funcionalidades núcleo e interacciones sociales de Twitter/X. Desarrollada como parte del proceso de evaluación técnica para **The Flock**, la aplicación implementa una arquitectura desacoplada y robusta, optimizada para entornos contenerizados mediante Docker y orquestada para desarrollo ágil a través de DevContainers.

El sistema destaca por un modelo de datos relacional normalizado estrictamente hasta la **4ª Forma Normal (4FN)**, mecanismos de autenticación propios y un conjunto de características avanzadas que incluyen respuestas jerárquicas en hilo, almacenamiento multimedia y un motor polimórfico de notificaciones en tiempo real.

---

## 2. Stack Tecnológico & Justificación Arquitectónica

La selección de las herramientas que componen el ecosistema de la aplicación se fundamenta en principios de mantenibilidad, tipado estático estricto, rendimiento en bases de datos relacionales y portabilidad:

### 💻 Frontend (Capa de Presentación)
* **Next.js (v14+) & React.js:** Se optó por Next.js para estructurar el cliente debido a su madurez en el renderizado eficiente y el manejo de rutas. Permite la hidratación asíncrona de componentes dinámicos en el cliente (como contadores de interacciones y scroll infinito) manteniendo un rendimiento óptimo en la renderización de la interfaz.
* **TypeScript:** Garantiza la seguridad de tipos en todo el ciclo de vida de los datos del frontend, mitigando errores en tiempo de ejecución y asegurando contratos de interfaces consistentes con los DTOs expuestos por la API.
* **Tailwind CSS:** Utilizado bajo un enfoque metodológico *Mobile-First*. Las clases utilitarias de Tailwind permiten compilar estilos altamente optimizados y adaptativos a través de breakpoints estrictos para Mobile (<640px), Tablet (640px-1024px) y Desktop (>1024px).

### ⚙️ Backend (Capa de Servicios)
* **NestJS:** Framework empresarial basado en Node.js que impone una arquitectura modular fuertemente inspirada en patrones de diseño sólidos (Inyección de Dependencias, Inversión de Control y separación clara mediante Controladores, Servicios y Módulos). Facilita la validación e interceptación estricta de peticiones.
* **TypeScript:** Utilizado en el backend para unificar el lenguaje de programación en todo el monorepo y asegurar que las capas de negocio operen bajo tipado estático de punta a punta.

### 🗄️ Capa de Datos & ORM
* **PostgreSQL (v16):** Motor de base de datos relacional de nivel empresarial elegido por su soporte nativo de tipos complejos (como UUIDs), excelente manejo de índices B-Tree y robustez en la gestión de restricciones de integridad referencial.
* **Prisma ORM:** Actúa como puente declarativo de acceso a datos. Genera un cliente TypeScript autogestionado y sincronizado directamente con el esquema físico, acelerando las consultas complejas y la ejecución del script de siembra (*Seed*).

### 🐳 Infraestructura & Herramientas de IA
* **Docker & Docker Compose:** Todo el stack de software (aplicación y base de datos) está empaquetado de forma agnóstica al sistema operativo anfitrión. Esto garantiza la inmutabilidad del entorno, eliminando el problema clásico de "funciona en mi máquina" y facilitando un despliegue inmediato con un único comando.
* **Gemini Code Assist:** Herramienta de Inteligencia Artificial centralizada para guiar el *Agentic Coding* del proyecto. Se utilizó activamente para optimizar el diseño de consultas, estructurar esquemas de datos relacionales, generar boilerplate repetitivo y expandir los casos de prueba automatizados.

---

## 🚀 Runbook Operativo (Setup & Operación)

> ⚠️ **REGLA DE ORO:** Siga estas instrucciones en orden secuencial. No asuma pasos implícitos. La aplicación se inicializa de forma autónoma dentro del entorno aislado de Docker.

### 📋 Prerrequisitos
Su entorno local solo requiere disponer de:
* **Docker** (Versión `>= 25.0.0` recomendada)
* **Docker Compose V2** (Versión `>= 2.24.0`)
* **Visual Studio Code** (Junto con la extensión *Dev Containers*)

### 🔧 1. Clonación y Acceso al Entorno Contenerizado
Proceda a clonar el repositorio y acceda a la raíz del proyecto:

```bash
git clone [https://github.com/kevincito087/preescription-app.git](https://github.com/kevincito087/preescription-app.git) birdie-twitter-clone
cd birdie-twitter-clone
```

#### Enfoque A: Inicialización Automatizada mediante VS Code DevContainers (Recomendado)

1. Abra el directorio `birdie-twitter-clone` con Visual Studio Code.
2. El editor detectará la configuración. Presione la notificación o abra la paleta de comandos (`Ctrl+Shift+P` / `Cmd+Shift+P`) y ejecute: **`Dev Containers: Reopen in Container`**.
3. El entorno construirá el entorno de Node 20 sobre Docker, montará las extensiones necesarias y abrirá una terminal integrada lista para operar dentro del contenedor.

#### Enfoque B: Inicialización Manual por Consola Externa

Si opta por operar de forma independiente a VS Code, levante los servicios en segundo plano:

Bash

```
docker-compose up -d
```

Luego, ingrese mediante un shell interactivo al contenedor principal de la aplicación:

Bash

```
docker exec -it twitter-clone-dev-app /bin/bash
```

### 📦 2. Instalación de Dependencias y Sincronización de Base de Datos

Dentro de la terminal del contenedor (directorio `/workspaces/...`), ejecute la instalación limpia de paquetes con **pnpm v9** y aplique las migraciones del esquema junto con la inyección de datos simulados:

Bash

```
# Instalar dependencias organizadas por workspaces
pnpm install

# Ejecutar las migraciones de Prisma y disparar el script de Seed Data automáticamente
pnpm --filter backend prisma migrate dev --name init
```

### 🏃‍♂️ 3. Despliegue de la Aplicación en Modo Desarrollo

Ejecute el comando unificado en la raíz del monorepo para inicializar en paralelo los servidores del cliente web y de la API:

Bash

```
pnpm dev
```

- **Cliente Web (Next.js):** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
- **API Gateway (NestJS):** [http://localhost:3001](https://www.google.com/search?q=http://localhost:3001)
- **Instancia PostgreSQL:** `localhost:5432`

### 🧪 4. Ejecución de la Suite de Testing

El proyecto cuenta con un riguroso set de pruebas que aseguran la fiabilidad de los flujos críticos (Autenticación, Tweets y Grafo Social). Para ejecutar todas las pruebas y auditar la cobertura de código, corra:

Bash

```
# Ejecutar unit, integration y E2E tests del ecosistema
pnpm test

# Obtener el reporte detallado de cobertura del backend
pnpm --filter backend test:cov
```

## 🔐 Datos de Acceso de Prueba (Seed Data)

El script de *seed data* puebla la base de datos con **10 usuarios ficticios realistas**, generando un grafo cruzado con múltiples publicaciones, seguidores y me gustas concurrentes para evaluar la aplicación inmediatamente. Puede iniciar sesión con la siguiente cuenta maestra precargada:

- **Email:** `testuser@birdie.com`
- **Password:** `FlockPassword2026!`

## 🛠️ Especificación de Variables de Entorno (`.env.example`)

Es obligatorio instanciar un archivo `.env` en la raíz del backend para alimentar las variables de entorno de la infraestructura:

Fragmento de código

```
# URL de conexión a la base de datos PostgreSQL direccionada al servicio de Docker
DATABASE_URL="postgresql://twitter_dev_user:twitter_dev_password@db:5432/twitter_clone_db?schema=public"

# Secreto criptográfico estricto para la firma y verificación de JSON Web Tokens (JWT)
JWT_SECRET="birdie_core_secure_secret_signature_2026"

# Tiempo de vigencia de la sesión del usuario en la plataforma
JWT_EXPIRES_IN="7d"

# Parámetros del Entorno
NODE_ENV="development"
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📐 Decisiones de Diseño & Arquitectura de Datos

### 1. Autenticación Propia Desacoplada (Sin Terceros)

En cumplimiento estricto con los requerimientos esenciales del reto, se eludió la integración de sistemas de terceros (Firebase Auth, Supabase Auth, Auth0). La autenticación se solventó mediante una estrategia local criptográfica:

- Las contraseñas se procesan en el backend aplicando un algoritmo asíncronamente salado a través de herramental nativo del backend para generar un hash irreversible (`password_hash`), el cual se guarda en tipo `VARCHAR(255)`.
- La verificación y persistencia de sesión se gestiona por medio de tokens firmados bajo el estándar **JWT (JSON Web Tokens)**. Las rutas privadas en la API están blindadas mediante Guards de NestJS que interceptan y validan la cabecera *Authorization Bearer*.

### 2. Justificación Arquitectónica de la 4ª Forma Normal (4FN)

Al modelar el grafo social y las interacciones masivas de la red se descartó de forma categórica el uso de colecciones embebidas u objetos estructurados JSON dentro de las tablas de `users` o `tweets` (prácticas que penalizan drásticamente el performance por reescritura de filas).

Bajo la implementación rigurosa de la **4FN**:

1. **Aislamiento de Dependencias Multivaloradas:** Las interacciones del grafo social (`follows`), me gustas (`likes`), almacenamiento de imágenes (`tweet_images`) y alertas lógicas (`notifications`) operan de forma segregada. Mutar o insertar una fila en la red de contactos jamás interfiere ni bloquea las transacciones simultáneas del flujo de tweets o interacciones mediáticas, maximizando la concurrencia.
2. **Llaves Primarias Compuestas:** Las relaciones Muchos a Muchos se resolvieron mediante tablas intermedias puras dadas por llaves primarias compuestas físicas, por ejemplo, `PRIMARY KEY (follower_id, following_id)` en `follows`. Esto impide la duplicación de datos de manera nativa en el motor SQL, abstrayendo lógica de validación manual en el código.
3. **Optimización de Lecturas en el Timeline:** El feed de publicaciones se procesa bajo demanda combinando los índices B-Tree de las claves foráneas de seguimiento. Se recuperan los identificadores de los usuarios seguidos, se cruzan contra la tabla de tweets filtrando por dichos autores y se ordenan de manera descendente mediante el índice de la marca de tiempo `created_at`, manejando paginación indexada por cursor para garantizar lecturas constantes en tiempo de respuesta ($O(\log n)$).

### 3. Implementación y Abstracción de Features Opcionales (Bonus)

- **Respuestas en Hilo (\*Reply Threads\*):** Se implementó una relación reflexiva en la tabla de `tweets`. El campo `parent_id` (de tipo UUID referenciado a la misma tabla) actúa como puntero jerárquico. Las filas con valor nulo se asumen como tweets principales, mientras que los IDs válidos estructuran el árbol de comentarios de manera recursiva.
- **Galería Multimedia Adaptativa:** Las referencias a las URLs de archivos adjuntos se extrajeron a la entidad satélite `tweet_images`. Dichas rutas se mapean como tipo de datos **`TEXT`** en PostgreSQL para evitar errores de truncado y desbordamiento debidos a strings kilométricos generados por tokens o firmas dinámicas de proveedores Cloud (AWS S3, Cloudinary).
- **Motor de Alertas Polimórficas:** La tabla de `notifications` gestiona los eventos del ecosistema mediante una **asociación polimórfica lógica**. Para eludir llaves foráneas muertas o condicionales (unir la misma columna a múltiples tablas físicas), el atributo `entity_id` almacena genéricamente un ID único, cuyo contexto resolutivo es determinado en la capa de software por el campo enumerado `type` (`'LIKE'`, `'FOLLOW'`, `'REPLY'`).

## ⚖️ Trade-offs y Limitaciones Conocidas

1. **Estrategia Fan-out-on-Read:** El cálculo del Timeline se ejecuta en tiempo de lectura uniendo tablas indexadas mediante consultas dinámicas. Para los volúmenes de datos estipulados y la densidad del seed data, esta técnica es altamente eficiente en memoria. No obstante, en un entorno de producción masivo (millones de usuarios activos), se requeriría migrar hacia un enfoque híbrido de *Fan-out-on-Write*, pre-calculando e indexando los timelines de los usuarios en almacenes en caché en memoria rápidos como Redis.
2. **Integridad Referencial de la Llave Polimórfica:** Al implementar un diseño de clave polimórfica en `notifications.entity_id`, la validación de integridad referencial no se delega al motor físico de PostgreSQL, sino que se administra estrictamente mediante las reglas de negocio codificadas en los servicios del backend.

## 🤖 Uso de Herramientas de Inteligencia Artificial (Agentic Coding)

Este desarrollo se llevó a cabo implementando metodologías ágiles de codificación asistida a través de **Gemini Code Assist** como copiloto central del ciclo de software.

- **Delegación de Tareas de Alta Velocidad:** Se aprovechó la capacidad de la IA para generar el boilerplate inicial de los módulos de NestJS, estructurar los objetos de mock de datos para la siembra del seed y autocompletar la cobertura de assertions en las pruebas de integración.
- **Gobierno de la Arquitectura (Supervisión Humana):** El control de diseño, las pautas de normalización de datos relacionales, el aislamiento de las tablas intermedias, la decisión técnica de omitir tipos `VARCHAR` de baja longitud en URLs y la conceptualización de los flujos polimórficos de la base de datos fueron dictados, auditados e implementados bajo rigurosa dirección humana, garantizando un código limpio, legible y con estándares de ingeniería de software senior.