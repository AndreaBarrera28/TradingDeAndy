# Despliegue

## Requisitos del Servidor

- **PHP** ^8.3
- **Composer** 2.x
- **Node.js** 20+ (para build de frontend)
- **NPM** 10+
- **Base de datos:** MySQL 8+ o MariaDB 10+ (recomendado para producción)

## Extensiones PHP Requeridas

- `BCMath`
- `Ctype`
- `Fileinfo`
- `JSON`
- `Mbstring`
- `OpenSSL`
- `PDO`
- `pdo_mysql` (o `pdo_sqlite`)
- `Tokenizer`
- `XML`
- `cURL`

---

## Entorno de Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone <repo-url> TradingDeAndy
cd TradingDeAndy
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
php artisan key:generate
```

Editar `.env` con la configuración local:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=trading_andy
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Instalar dependencias

```bash
composer install
npm install --ignore-scripts
```

### 4. Migrar base de datos

```bash
php artisan migrate
```

### 5. Build de assets (frontend Inertia)

```bash
npm run build
```

### 6. Iniciar servidores

**Opción 1: Script dev (todo en uno):**

```bash
composer dev
```

Esto ejecuta concurrentemente:
- `php artisan serve` (backend en puerto 8000)
- `php artisan queue:listen` (cola de trabajos)
- `php artisan pail` (logs en tiempo real)
- `npm run dev` (Vite hot reload)

**Opción 2: Por separado:**

```bash
# Terminal 1 - Backend
php artisan serve

# Terminal 2 - Frontend Inertia (hot reload)
npm run dev

# Terminal 3 - Frontend SPA independiente
cd frontend
npm run dev
```

### 7. Acceder a la aplicación

- **API Backend:** http://localhost:8000/api
- **Frontend Inertia:** http://localhost:8000
- **Frontend SPA:** http://localhost:5173 (o el puerto que asigne Vite)

---

## Scripts Disponibles

### Composer

| Comando | Descripción |
|---------|-------------|
| `composer setup` | Configuración completa inicial |
| `composer dev` | Inicia servidores de desarrollo |
| `composer test` | Ejecuta tests (config:clear + artisan test) |

### NPM (raíz)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite dev server (frontend Inertia) |
| `npm run build` | Build de producción (frontend Inertia) |

### NPM (frontend/)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite dev server (SPA independiente) |
| `npm run build` | Build de producción (SPA independiente) |
| `npm run lint` | ESLint |
| `npm run preview` | Vista previa del build |

---

## Entorno de Producción

### 1. Preparar la aplicación

```bash
# Optimizar autoloader
composer install --optimize-autoloader --no-dev

# Optimizar config
php artisan config:cache

# Optimizar rutas
php artisan route:cache

# Optimizar vistas
php artisan view:cache

# Migrar base de datos
php artisan migrate --force
```

### 2. Build de assets

**Frontend Inertia (desde raíz):**
```bash
npm ci --ignore-scripts
npm run build
```

**Frontend SPA independiente (si se usa):**
```bash
cd frontend
npm ci --ignore-scripts
npm run build
```

### 3. Configurar servidor web

**Nginx:**
```nginx
server {
    listen 80;
    server_name tradingdeandy.com;
    root /var/www/TradingDeAndy/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Apache:**
```apache
<VirtualHost *:80>
    ServerName tradingdeandy.com
    DocumentRoot /var/www/TradingDeAndy/public

    <Directory /var/www/TradingDeAndy/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/tradingdeandy-error.log
    CustomLog ${APACHE_LOG_DIR}/tradingdeandy-access.log combined
</VirtualHost>
```

### 4. Variables de Entorno para Producción

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tradingdeandy.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=trading_andy
DB_USERNAME=production_user
DB_PASSWORD=strong_password

SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=strong_redis_password
REDIS_PORT=6379

LOG_LEVEL=warning
```

### 5. Tareas Programadas (Cron)

Añadir al crontab:
```bash
* * * * * cd /var/www/TradingDeAndy && php artisan schedule:run >> /dev/null 2>&1
```

### 6. Colas (Supervisor)

Configurar supervisor para `queue:work`:

```ini
[program:tradingdeandy-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/TradingDeAndy/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/TradingDeAndy/storage/logs/queue.log
stopwaitsecs=3600
```

---

## Notas Adicionales

- El frontend SPA independiente (`frontend/`) requiere configuración de proxy en Vite para evitar CORS en desarrollo:
  ```javascript
  // frontend/vite.config.js
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
  ```
- Para producción, el frontend SPA debería servirse desde el mismo dominio o configurar CORS adecuadamente en Laravel
- No olvidar configurar `SANCTUM_STATEFUL_DOMAINS` en producción si se usa autenticación SPA
