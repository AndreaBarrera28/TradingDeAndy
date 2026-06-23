# Autenticación

## Estado Actual

La autenticación **no está activa** en este proyecto. Aunque Laravel Sanctum está instalado y configurado, las rutas de la API no tienen middleware de autenticación aplicado.

## Configuración Existente

### Sanctum (`config/sanctum.php`)

**Stateful Domains (SPA authentication):**
```php
'stateful' => [
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:8000',
    '::1',
    // + APP_URL dinámico
]
```

**Guard:**
```php
'guard' => ['web'],  // Usa el guard de sesión web
```

**Middleware:**
```php
'middleware' => [
    'authenticate_session' => AuthenticateSession::class,
    'encrypt_cookies' => EncryptCookies::class,
    'validate_csrf_token' => ValidateCsrfToken::class,
]
```

**Expiración de tokens:** `null` (sin expiración)

### Auth (`config/auth.php`)

```php
'defaults' => [
    'guard' => 'web',
    'passwords' => 'users',
]

'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
]

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
]
```

### Modelo User

```php
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```

### Migración de Users

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### Middleware HandleInertiaRequests

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user(),
        ],
    ];
}
```

Este middleware comparte el usuario autenticado con las vistas Inertia (para el frontend Inertia).

## Cómo Activar Autenticación

### Paso 1: Añadir rutas de login/register

Crear un `AuthController` o usar Laravel Breeze/Jetstream para generar las rutas de autenticación.

### Paso 2: Proteger rutas API

En `routes/api.php`, agrupar las rutas bajo middleware `auth:sanctum`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('trades', TradeController::class)->only(['index', 'store', 'update']);
    Route::get('stats', [TradeController::class, 'stats']);
    Route::get('prices', [TradeController::class, 'prices']);
    Route::get('analyze', [AnalysisController::class, 'detect']);
    Route::get('settings', [SettingsController::class, 'show']);
    Route::put('settings', [SettingsController::class, 'update']);
});
```

### Paso 3: Frontend

Para el SPA independiente (`frontend/`), configurar Axios para enviar cookies con cada petición:

```javascript
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
});
```

### Paso 4: CSRF

Antes de cualquier petición POST/PUT, obtener el token CSRF:

```javascript
await axios.get('/sanctum/csrf-cookie');
```

## Tablas Relacionadas

| Tabla | Propósito |
|-------|-----------|
| `users` | Almacena usuarios registrados |
| `personal_access_tokens` | Almacena tokens de API (Sanctum) |
| `password_reset_tokens` | Almacena tokens de reseteo de contraseña |
| `sessions` | Almacena sesiones activas |

## Recomendaciones

1. **Activar autenticación** antes de poner el proyecto en producción
2. Usar **Laravel Breeze** (Inertia + React) para generar scaffolding de auth que sea compatible con el frontend existente
3. Añadir **middleware `auth:sanctum`** a las rutas API
4. Configurar **CORS** adecuadamente si el frontend SPA está en dominio/puerto diferente
5. Implementar **login/register/logout** en el frontend SPA
