# 📊 Modelo Entidad-Relación (ER) - Clon de Twitter/X

Este documento detalla el diseño estructural y las especificaciones físicas de la base de datos relacional para el clon de Twitter/X. El modelo ha sido normalizado estrictamente hasta la **4ª Forma Normal (4FN)** para garantizar la integridad absoluta de los datos, eliminar redundancias y optimizar el rendimiento de las consultas indexadas en el grafo social, incluyendo el soporte nativo para las características de bonus (imágenes y notificaciones).

> 💡 **Nota de Modelado (StarUML):** Los tipos de datos están adaptados para su compatibilidad en herramientas de modelado como StarUML, utilizando enteros para banderas lógicas y estructuras extensibles, mapeando directamente a tipos nativos optimizados en el despliegue final en PostgreSQL.

---

## 🛠️ Especificación de Tablas, Restricciones y Relaciones

### 1. 👤 Tabla: `users`
Almacena las credenciales de autenticación, metadatos de la cuenta y la información del perfil público de los usuarios.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo             | Tipo de Datos | Restricciones                            | Descripción y Reglas de Negocio                              |
| :---------------- | :------------ | :--------------------------------------- | :----------------------------------------------------------- |
| 🔑 `id`            | UUID          | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identificador único global e inmutable del usuario.          |
| 🏷️ `username`      | VARCHAR(50)   | UNIQUE, NOT NULL, INDEX                  | Nombre de usuario único (ej: @dev_kevin) utilizado para menciones y búsquedas. |
| 📧 `email`         | VARCHAR(255)  | UNIQUE, NOT NULL                         | Correo electrónico verificado para el inicio de sesión obligatorio. |
| 🔒 `password_hash` | VARCHAR(255)  | NOT NULL                                 | Hash seguro de la contraseña (encriptado mediante Argon2/BCrypt en el backend). |
| 📝 `bio`           | TEXT          | NULLABLE                                 | Biografía o descripción corta del perfil (Validación estricta de máx. 160 caracteres). |
| 🖼️ `avatar_url`    | TEXT          | NULLABLE                                 | URL pública de la imagen de perfil almacenada. Se usa `TEXT` para prevenir desbordamientos por rutas dinámicas largas en almacenamiento Cloud. |
| 📅 `created_at`    | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                | Marca de tiempo que registra la fecha y hora exacta del registro del usuario. |
| 🔄 `updated_at`    | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                | Marca de tiempo de la última actualización de los datos del perfil. |

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación de Autoría de Publicaciones:**
    * **Tipo_relacion:** `users` (1) -> `tweets` (N)
    * **Descripción de relación:** Relaciona de forma directa la tabla de usuarios con la tabla de publicaciones. Un registro en `users` puede estar vinculado a cero o múltiples registros en `tweets` a través de la clave foránea `tweets.user_id`, garantizando que todo tweet sea asociado con su respectiva cuenta creadora.
    * **Ejemplo en la app:** Al entrar al perfil de `@kevin`, el frontend ejecuta un `SELECT * FROM tweets WHERE user_id = 'id_de_kevin'`. Si el usuario decide eliminar su cuenta permanentemente, todos sus tweets se eliminan del sistema de forma automática debido a la restricción `ON DELETE CASCADE`.
* **B) Relación de Grafo Social Activo (Rol Seguidor):**
    * **Tipo_relacion:** `users` (1) -> `follows` (N)
    * **Descripción de relación:** Conecta la tabla principal `users` con la tabla intermedia `follows`. El campo `users.id` se mapea como una clave foránea hacia `follows.follower_id`, representando a las cuentas que el usuario decide seguir activamente.
    * **Ejemplo en la app:** Cuando le das al botón "Seguir" en los perfiles de 5 desarrolladores, tu identificador único de la tabla `users` se inserta 5 veces en el campo `follower_id` de la tabla `follows`.
* **C) Relación de Grafo Social Pasivo (Rol Seguido):**
    * **Tipo_relacion:** `users` (1) -> `follows` (N)
    * **Descripción de relación:** Vincula la tabla principal `users` con la tabla intermedia `follows`. El campo `users.id` se mapea como una clave foránea hacia `follows.following_id`, registrando de forma indexada los seguidores que una cuenta acumula de manera pasiva.
    * **Ejemplo en la app:** Si 100 personas deciden seguir tu perfil, tu identificador de la tabla `users` aparecerá almacenado exactamente 100 veces en el campo `following_id` de la tabla `follows`.
* **D) Relación de Emisión de Interacciones (Likes):**
    * **Tipo_relacion:** `users` (1) -> `likes` (N)
    * **Descripción de relación:** Mapea la tabla `users` con la tabla relacional de interacciones `likes`. Modela el flujo donde el campo de origen `users.id` actúa como clave foránea en `likes.user_id` para identificar fehacientemente qué usuario disparó la reacción.
    * **Ejemplo en la app:** Cada vez que presionas el corazón en diferentes tweets de tu feed, se registra una nueva fila atómica en la base de datos asociando tu `id` con cada `tweet_id` correspondiente.
* **E) Relación de Origen de Notificaciones:**
    * **Tipo_relacion:** `users` (1) -> `notifications` (N)
    * **Descripción de relación:** Conecta la tabla `users` con `notifications` a través del campo `notifications.notifier_id`. Identifica al usuario que realiza la acción detonante (like, follow, reply).
    * **Ejemplo en la app:** Si `@kevin` le da like a tu tweet, el sistema inserta una notificación donde `notifier_id` es el ID de `@kevin`.
* **F) Relación de Destino de Notificaciones:**
    * **Tipo_relacion:** `users` (1) -> `notifications` (N)
    * **Descripción de relación:** Conecta la tabla `users` con `notifications` a través del campo `notifications.receiver_id`. Indexa las notificaciones que pertenecen al buzón privado de un usuario específico.
    * **Ejemplo en la app:** Cuando inicias sesión, la campana de notificaciones hace un `SELECT COUNT(*) FROM notifications WHERE receiver_id = 'tu_id' AND is_read = 0` para mostrar el globo rojo de alertas pendientes.

---

### 2. 🐦 Tabla: `tweets`
Almacena el contenido de las publicaciones y gestiona de forma jerárquica las respuestas e hilos de conversación.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo          | Tipo de Datos | Restricciones                                         | Descripción y Reglas de Negocio                              |
| :------------- | :------------ | :---------------------------------------------------- | :----------------------------------------------------------- |
| 🔑 `id`         | UUID          | PRIMARY KEY, DEFAULT `gen_random_uuid()`              | Identificador único e inmutable del tweet o de la respuesta. |
| 👤 `user_id`    | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE            | ID del autor de la publicación. Mapea directamente con la entidad creadora. |
| 💬 `content`    | VARCHAR(280)  | NOT NULL                                              | Contenido textual del post. Validación estricta a nivel de base de datos (Máx. 280 caracteres). |
| 🔄 `parent_id`  | UUID          | NULLABLE, FOREIGN KEY (`tweets.id`) ON DELETE CASCADE | Puntero reflexivo al tweet origen. Si es `NULL`, es un tweet raíz. Si contiene un ID, es una respuesta. |
| 📅 `created_at` | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`, INDEX                      | Marca de tiempo indexada en árbol B-Tree para acelerar la ordenación cronológica del Timeline. |

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación de Pertenencia de Contenido:**
    * **Tipo_relacion:** `tweets` (N) -> `users` (1)
    * **Descripción de relación:** Vincula la tabla `tweets` de regreso con la tabla `users`. El campo local `tweets.user_id` actúa como una restricción de clave foránea referenciando directamente a `users.id`. Múltiples registros de publicaciones se agruuan bajo un único perfil de usuario.
    * **Ejemplo en la app:** En el Home Feed, cada componente de Tweet renderiza el `username` y el `avatar_url` del autor haciendo un *Join* rápido o una consulta indexada utilizando el `user_id` adjunto en la publicación.
* **B) Relación Jerárquica de Respuestas (Conversaciones):**
    * **Tipo_relacion:** `tweets` [Padre] (1) -> `tweets` [Hijo] (N) *(Relación Reflexiva)*
    * **Descripción de relación:** Conecta la tabla `tweets` consigo misma para organizar estructuras en hilos. El campo `tweets.parent_id` es una clave foránea reflexiva apuntando hacia `tweets.id`, permitiendo que un tweet raíz almacene de forma ordenada múltiples tweets hijos (comentarios).
    * **Ejemplo en la app:** Cuando haces clic en un tweet para expandirlo y ver el detalle de la conversación (*Reply Threads*), la API realiza la consulta `SELECT * FROM tweets WHERE parent_id = 'id_del_tweet_seleccionado' ORDER BY created_at ASC` para pintar el hilo de comentarios en orden jerárquico.
* **C) Relación de Recepción de Interacciones:**
    * **Tipo_relacion:** `tweets` (1) -> `likes` (N)
    * **Descripción de relación:** Conecta la tabla de publicaciones `tweets` con la tabla intermedia `likes`. Utiliza el campo `likes.tweet_id` como clave foránea dirigida a `tweets.id`, mapeando de forma directa cuántas interacciones independientes se han acumulado sobre una misma publicación.
    * **Ejemplo en la app:** Para mostrar el contador visual de corazones de un tweet, el backend ejecuta un conteo agregador: `SELECT COUNT(*) FROM likes WHERE tweet_id = 'id_del_tweet'`. Si el tweet es eliminado por su autor, todos los registros de likes asociados a él se purgan en cascada.
* **D) Relación con Contenido Multimedia (Bonus):**
    * **Tipo_relacion:** `tweets` (1) -> `tweet_images` (N)
    * **Descripción de relación:** Vincula la tabla `tweets` con la tabla de archivos adjuntos `tweet_images` mediante la clave foránea `tweet_images.tweet_id`. Mantiene la entidad del tweet limpia y lista para soportar múltiples imágenes por post sin romper la normalización.
    * **Ejemplo en la app:** Al renderizar un tweet que contiene imágenes adjuntas, el cliente web consume las URLs vinculadas mapeando los registros de la tabla `tweet_images` cuyo campo coincida con el ID de la publicación.

---

### 3. 👥 Tabla: `follows` (Grafo Social)
Tabla intermedia pura que rompe la relación Muchos a Muchos (M:N) entre usuarios para modelar la red de seguidores. Cumple estrictamente con la 4FN al aislar esta dependencia multivalorada.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo            | Tipo de Datos | Restricciones                              | Descripción y Reglas de Negocio                              |
| :--------------- | :------------ | :----------------------------------------- | :----------------------------------------------------------- |
| ➡️ `follower_id`  | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE | ID del usuario que ejecuta la acción activa de comenzar a seguir a alguien. |
| ⬅️ `following_id` | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE | ID de la cuenta destino que recibe el seguimiento de forma pasiva. |
| 📅 `created_at`   | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                  | Fecha y hora exacta en la que se consolidó el vínculo de seguimiento. |

* 🔒 **Llave Primaria Compuesta:** `PRIMARY KEY (follower_id, following_id)`. Esta restricción física a nivel de base de datos impide de forma nativa que existan duplicados (un usuario no puede seguir dos veces a la misma persona).

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación de Conectividad de la Red Social (Grafo Dirigido):**
    * **Tipo_relacion:** `follows` (M) <-> `users` (N)
    * **Descripción de relación:** Estructura una relación Muchos a Muchos resolviendo de forma atómica el cruce entre la tabla `users` consigo misma. El campo `follows.follower_id` enlaza con la entidad origen de usuarios y `follows.following_id` mapea con la entidad destino de usuarios, abstrayendo de manera eficiente la matriz completa de la red de contactos.
    * **Ejemplo en la app:** Para construir el **Home Timeline** de un usuario conectado, el sistema primero extrae el listado de IDs que el usuario sigue (`SELECT following_id FROM follows WHERE follower_id = 'mi_id'`). Posteriormente, utiliza ese conjunto de IDs para buscar y ordenar los posts más recientes en la tabla de tweets: `SELECT * FROM tweets WHERE user_id IN (lista_de_ids_seguidos) ORDER BY created_at DESC LIMIT 20`.

---

### 4. ❤️ Tabla: `likes` (Interacciones)
Tabla intermedia pura que rompe la relación Muchos a Muchos (M:N) entre usuarios y tweets. Cumple con la 4FN al aislar las interacciones de los me gusta de forma independiente al grafo social.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo          | Tipo de Datos | Restricciones                               | Descripción y Reglas de Negocio                              |
| :------------- | :------------ | :------------------------------------------ | :----------------------------------------------------------- |
| 👤 `user_id`    | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE  | ID del usuario que reacciona positivamente al contenido presionando el botón. |
| 🐦 `tweet_id`   | UUID          | FOREIGN KEY (`tweets.id`) ON DELETE CASCADE | ID del tweet específico sobre el cual se registra el impacto de la interacción. |
| 📅 `created_at` | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                   | Fecha y hora exacta en la que el usuario otorgó el me gusta. |

* 🔒 **Llave Primaria Compuesta:** `PRIMARY KEY (user_id, tweet_id)`. Restringe a nivel de motor de BD que un usuario registre más de un Like en un mismo tweet, resolviendo de forma nativa la consistencia del negocio.

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación Cruzada de Interacción de Contenido:**
    * **Tipo_relacion:** `likes` (M) <-> `users` (1) / `tweets` (1)
    * **Descripción de relación:** Conecta de forma multidireccional la entidad de `users` con la entidad de `tweets` a través de claves foráneas compuestas. Cruza `likes.user_id` (referenciando la procedencia del actor en `users`) con `likes.tweet_id` (referenciando el destino del contenido en `tweets`), logrando un mapeo puro de interacciones sin alterar el estado de las tablas maestras.
    * **Ejemplo en la app:** Cuando el usuario presiona el botón de corazón en la interfaz:
        1.  El frontend verifica si el corazón ya está activo.
        2.  Si **no** está activo, la API ejecuta un `INSERT INTO likes (user_id, tweet_id) VALUES (...)` (el contador de la UI sube +1).
        3.  Si **ya** estaba activo (el usuario quiere quitar el like), la API ejecuta un `DELETE FROM likes WHERE user_id = 'mi_id' AND tweet_id = 'id_tweet'` (el corazón se apaga y el contador visual baja -1).

---

### 5. 🖼️ Tabla: `tweet_images` (Bonus: Galería Multimedia)
Entidad de apoyo estructurada para almacenar las referencias URL de las imágenes subidas a la plataforma, vinculadas directamente a sus respectivos tweets.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo          | Tipo de Datos | Restricciones                               | Descripción y Reglas de Negocio                              |
| :------------- | :------------ | :------------------------------------------ | :----------------------------------------------------------- |
| 🔑 `id`         | UUID          | PRIMARY KEY, DEFAULT `gen_random_uuid()`    | Identificador único global e inmutable de la imagen indexada. |
| 🐦 `tweet_id`   | UUID          | FOREIGN KEY (`tweets.id`) ON DELETE CASCADE | Clave foránea que asocia rígidamente la imagen con el tweet contenedor. |
| 🌐 `image_url`  | TEXT          | NOT NULL                                    | URL absoluta del archivo almacenado (ej: AWS S3/Cloudinary). Se define como `TEXT` para evitar truncados por tokens de autenticación o firmas dinámicas largas en la URL. |
| 📅 `created_at` | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                   | Sello de tiempo de subida del archivo multimedia al sistema. |

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación de Dependencia Multimedia:**
    * **Tipo_relacion:** `tweet_images` (N) -> `tweets` (1)
    * **Descripción de relación:** Conecta la tabla de imágenes con la tabla de tweets. El campo `tweet_images.tweet_id` referencia directamente a `tweets.id`, asegurando que múltiples recursos visuales dependan de una única entidad de publicación lógica.
    * **Ejemplo en la app:** Al publicar un Tweet con 3 fotos, se guarda un único registro en la tabla `tweets` y se realizan 3 inserts en la tabla `tweet_images` apuntando al `id` de ese mismo tweet.

---

### 🔔 6. Tabla: `notifications` (Bonus: Motor de Alertas)
Entidad encargada de registrar los eventos sociales de interacción. **Utiliza un diseño de Relación Polimórfica Lógica** para flexibilizar el destino de las alertas sin saturar el motor con múltiples llaves foráneas condicionales.

#### 📋 Esquema Físico (Diccionario de Datos)
| Campo           | Tipo de Datos | Restricciones                              | Descripción y Reglas de Negocio                              |
| :-------------- | :------------ | :----------------------------------------- | :----------------------------------------------------------- |
| 🔑 `id`          | UUID          | PRIMARY KEY, DEFAULT `gen_random_uuid()`   | Identificador único global de la alerta emitida.             |
| 👤 `notifier_id` | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE | ID del usuario origen que ejecuta la acción detonante del evento. |
| 📥 `receiver_id` | UUID          | FOREIGN KEY (`users.id`) ON DELETE CASCADE | ID del usuario destino que debe ser notificado del evento en su buzón. |
| 🏷️ `type`        | VARCHAR(20)   | NOT NULL                                   | Enumeración del tipo de evento. Valores: `'LIKE'`, `'FOLLOW'`, `'REPLY'`. |
| 🔍 `entity_id`   | UUID          | NULLABLE                                   | **Llave Polimórfica Lógica (Sin restricción física FK):** Guarda el ID del objeto relacionado. Si `type` es `'LIKE'` o `'REPLY'`, este campo contiene el ID correspondiente de la tabla `tweets`. Si es `'FOLLOW'`, se mantiene en `NULL`. Esto permite expandir el sistema a nuevas entidades en el futuro sin romper restricciones estructurales. |
| 👁️ `is_read`     | INT           | NOT NULL, DEFAULT `0`                      | Bandera de estado para el control de lectura del lado del cliente. Compatible con StarUML (`0` = No leído, `1` = Leído). En el despliegue de PostgreSQL mapea nativamente a tipo `BOOLEAN` (`FALSE`/`TRUE`). |
| 📅 `created_at`  | TIMESTAMP     | NOT NULL, DEFAULT `NOW()`                  | Marca de tiempo cronológica para enlistar las notificaciones desde la más reciente. |

#### 🔗 Relaciones Vinculadas a esta Tabla
* **A) Relación de Direccionamiento de Alertas:**
    * **Tipo_relacion:** `notifications` (N) -> `users` [Origen] (1) / `users` [Destino] (1)
    * **Descripción de relación:** Relaciona la tabla de notificaciones con la tabla de usuarios por partida doble a través de claves foráneas físicas (`notifier_id` y `receiver_id`), lo que permite saber con precisión matemática quién causó la alerta y en qué buzón privado depositarla.
    * **Ejemplo en la app:** Cuando alguien te sigue, la API hace un `INSERT INTO notifications (notifier_id, receiver_id, type, entity_id) VALUES ('id_del_seguidor', 'tu_id', 'FOLLOW', NULL)`. Tu interfaz renderiza: *"@usuario ha comenzado a seguirte"*.
* **B) Relación Polimórfica Externa (Lógica):**
    * **Tipo_relacion:** `notifications` (N) - - -> `tweets` (1) *(Asociación Lógica Desacoplada)*
    * **Descripción de relación:** Asociación condicional basada en software (Backend). El campo `entity_id` resuelve la unión dinámica con el registro de destino únicamente cuando el campo `type` equivale a operaciones de contenido.
    * **Ejemplo en la app:** Si el usuario hace clic en una notificación de tipo `'LIKE'`, el backend lee el `entity_id`, sabe lógicamente que debe consultar la tabla `tweets` con ese ID y redirige la interfaz al componente visual del post para que el usuario pueda interactuar.

---

## 🎯 Justificación Arquitectónica de la 4ª Forma Normal (4FN)

Al diseñar esta base de datos para la evaluación técnica, se descartó el almacenamiento de colecciones embebidas o arreglos de IDs de seguidores/likes en formato JSON dentro de las tablas principales de `users` o `tweets` (errores comunes de diseño que degradan el performance).

Bajo la implementación estricta de la **4FN**:
1.  **Aislamiento de Dependencias Multivaloradas:** Las interacciones de la red de contactos (`follows`), las interacciones de contenido (`likes`), la metadata de imágenes (`tweet_images`) y las alertas (`notifications`) coexisten en estructuras totalmente aisladas. Modificar o insertar un nuevo seguidor jamás bloqueará las lecturas o escrituras del flujo de me gustas ni de las subidas de imágenes, optimizando el rendimiento concurrencial de la API.
2.  **Garantía de Integridad Referencial Nativa:** Delegar las restricciones a las llaves primarias compuestas físicas y llaves foráneas de PostgreSQL elimina la necesidad de saturar el backend con código de validación manual o transacciones complejas antes de insertar una fila.
3.  **Velocidad de Lectura Constante ($O(\log n)$):** El uso de tipos de datos de longitud fija (UUID) combinados con índices B-Tree estructurados en las llaves compuestas y marcas de tiempo asegura que la agregación de métricas responda en milisegundos, listos para soportar la carga masiva del script de *seed data*.