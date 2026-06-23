# Base de Datos

## Configuración

### Conexión por defecto

El proyecto está configurado para usar **SQLite** por defecto (según `.env.example`), pero el `.env` actual apunta a **MySQL**:

```env
# .env actual (local)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=trading_andy
DB_USERNAME=root
DB_PASSWORD=

# .env.example (por defecto)
DB_CONNECTION=sqlite
```

### Conexiones disponibles (`config/database.php`)

- **sqlite** — por defecto, archivo en `database/database.sqlite`
- **mysql** — configurado para desarrollo local
- **mariadb** — disponible para producción
- **pgsql** — disponible para PostgreSQL
- **sqlsrv** — disponible para SQL Server
- **redis** — configurado como cache (no usado activamente)

---

## Migraciones

El proyecto tiene **8 migraciones** que definen el esquema completo:

### 1. `0001_01_01_000000_create_users_table.php`

Crea 3 tablas del sistema de autenticación de Laravel:

**Tabla `users`**
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | bigint | PK, auto_increment |
| name | string(255) | NOT NULL |
| email | string(255) | NOT NULL, UNIQUE |
| email_verified_at | timestamp | NULLABLE |
| password | string(255) | NOT NULL |
| remember_token | string(100) | NULLABLE |
| created_at | timestamp | NULLABLE |
| updated_at | timestamp | NULLABLE |

**Tabla `password_reset_tokens`**
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| email | string(255) | PRIMARY KEY |
| token | string(255) | NOT NULL |
| created_at | timestamp | NULLABLE |

**Tabla `sessions`**
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | string(255) | PRIMARY KEY |
| user_id | bigint | NULLABLE, INDEX, FK → users |
| ip_address | string(45) | NULLABLE |
| user_agent | text | NULLABLE |
| payload | longText | NOT NULL |
| last_activity | int | INDEX |

### 2. `0001_01_01_000001_create_cache_table.php`

Tabla `cache` y `cache_locks` para el driver de cache database.

### 3. `0001_01_01_000002_create_jobs_table.php`

Tablas `jobs`, `job_batches`, `failed_jobs` para el sistema de colas.

### 4. `2026_06_18_233520_create_trades_table.php`

**Tabla `trades`** — tabla principal de la aplicación.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | bigint | PK, auto_increment |
| date | datetime | NOT NULL |
| pair | string(10) | NOT NULL |
| direction | enum('buy','sell') | NOT NULL |
| entry_price | decimal(14,5) | NOT NULL |
| exit_price | decimal(14,5) | DEFAULT NULL (ver migración 8) |
| stop_loss | decimal(14,5) | NULLABLE |
| take_profit | decimal(14,5) | NULLABLE |
| lot_size | decimal(8,2) | DEFAULT 0.01 |
| result | enum('win','loss','breakeven') | NULLABLE (ver migración 7) |
| pips | decimal(10,1) | NULLABLE |
| confluence_score | tinyint(3) UNSIGNED | NULLABLE |
| setup_notes | text | NULLABLE |
| entry_reason | text | NULLABLE |
| exit_reason | text | NULLABLE |
| emotions | string(255) | NULLABLE |
| lessons | text | NULLABLE |
| created_at | timestamp | NULLABLE |
| updated_at | timestamp | NULLABLE |

### 5. `2026_06_18_234647_create_personal_access_tokens_table.php`

Tabla `personal_access_tokens` para Laravel Sanctum (tokens de API).

### 6. `2026_06_19_000028_add_status_to_trades_table.php`

Añade la columna `status` (enum: 'open', 'closed', 'analyzed') a la tabla `trades`.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| status | enum('open','closed','analyzed') | DEFAULT 'open' |

### 7. `2026_06_19_000047_add_status_and_confluence_to_trades.php`

Añade las columnas `confluence_factors` (JSON) y modifica el esquema existente.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| confluence_factors | json | NULLABLE |

### 8. `2026_06_19_040631_fix_nullable_exit_price.php`

Corrige `exit_price` para que acepte NULL (estaba como NOT NULL inicialmente).

```sql
ALTER TABLE trades MODIFY exit_price DECIMAL(14,5) NULL;
```

---

## Modelo Trade: Casts y Fillable

### `$fillable`
```php
protected $fillable = [
    'status', 'date', 'pair', 'direction', 'entry_price', 'exit_price',
    'stop_loss', 'take_profit', 'lot_size', 'result', 'pips',
    'confluence_score', 'confluence_factors', 'setup_notes',
    'entry_reason', 'exit_reason', 'emotions', 'lessons',
];
```

### `$casts`
```php
'date' => 'datetime',              // Carbon\Carbon
'entry_price' => 'decimal:5',      // 5 decimales
'exit_price' => 'decimal:5',
'stop_loss' => 'decimal:5',
'take_profit' => 'decimal:5',
'confluence_score' => 'integer',   // Cast a entero
'confluence_factors' => 'array',   // JSON → PHP array automático
```

---

## Diagrama ER (Simplificado)

```
┌─────────────────────────────────────────────────────────────────┐
│                         trades                                    │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                   │ bigint                                │
│ date                      │ datetime                              │
│ pair                      │ varchar(10)                           │
│ direction                 │ enum('buy','sell')                    │
│ entry_price               │ decimal(14,5)                         │
│ exit_price                │ decimal(14,5) NULL                    │
│ stop_loss                 │ decimal(14,5) NULL                    │
│ take_profit               │ decimal(14,5) NULL                    │
│ lot_size                  │ decimal(8,2)                          │
│ result                    │ enum('win','loss','breakeven') NULL   │
│ pips                      │ decimal(10,1) NULL                    │
│ confluence_score          │ tinyint(3) UNSIGNED NULL              │
│ confluence_factors        │ json NULL                             │
│ status                    │ enum('open','closed','analyzed')      │
│ setup_notes               │ text NULL                             │
│ entry_reason              │ text NULL                             │
│ exit_reason               │ text NULL                             │
│ emotions                  │ varchar(255) NULL                     │
│ lessons                   │ text NULL                             │
│ created_at                │ timestamp NULL                        │
│ updated_at                │ timestamp NULL                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│            users                      │
├─────────────────────────────────────┤
│ id (PK)         │ bigint             │
│ name            │ varchar(255)       │
│ email           │ varchar(255) UNIQUE│
│ password        │ varchar(255)       │
│ ...             │ ...                │
└─────────────────────────────────────┘
           │ 1
           │
           │ N (opcional, vía sessions)
           ▼
┌─────────────────────────────────────┐
│          sessions                    │
├─────────────────────────────────────┤
│ id (PK)         │ varchar(255)       │
│ user_id (FK)    │ bigint NULL        │
│ ...             │ ...                │
└─────────────────────────────────────┘
```

---

## Almacenamiento Adicional

### Cache
Driver: `database` — usa tablas `cache` y `cache_locks`

### Sesiones
Driver: `database` — usa tabla `sessions`

### Colas
Driver: `database` — usa tablas `jobs`, `job_batches`, `failed_jobs`

### Redis
Configurado pero no activo en el `.env` actual. Puerto 6379, database 0 (default) y 1 (cache).
