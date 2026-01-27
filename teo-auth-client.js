// Cliente actualizado para manejar CORS correctamente
class TeoAuthClient {
  constructor(apiBaseUrl) {
    this.baseUrl = apiBaseUrl;
    this.sessionData = this.getStoredSession();
  }

  // Configuración base para todas las peticiones
  getRequestConfig(options = {}) {
    return {
      credentials: 'include', // Importante para CORS con cookies
      mode: 'cors', // Explícitamente usar CORS
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
  }

  // Obtener token CSRF requerido por NextAuth
  async fetchCSRFToken() {
    const response = await fetch(`${this.baseUrl}/api/auth/csrf`, this.getRequestConfig());
    const data = await response.json();
    return data.csrfToken;
  }

  // Login usando endpoint personalizado para cross-domain
  async authenticate(email, password) {
    try {
      console.log("Iniciando autenticación...");
      
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/login-external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const result = await loginResponse.json();

      if (loginResponse.ok && result.success) {
        // Guardar token en localStorage o sessionStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('teo-auth-token', result.token);
          localStorage.setItem('teo-auth-user', JSON.stringify(result.user));
        }
        this.sessionData = {
          user: result.user,
          token: result.token
        };
        return { success: true, user: result.user, token: result.token };
      }
      
      return { success: false, error: result.error || 'Credenciales incorrectas' };
    } catch (error) {
      console.error('Error en autenticación:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/session`, this.getRequestConfig());
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  }

  // Cerrar sesión
  async signOut() {
    try {
      // Intentar cerrar sesión en el servidor si hay token
      const token = this.getStoredToken();
      if (token) {
        await fetch(`${this.baseUrl}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          ...this.getRequestConfig()
        });
      }
      this.clearSession();
      return true;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      this.clearSession(); // Limpiar localmente aunque falle el servidor
      return false;
    }
  }

  // Verificar si el token actual es válido
  async verifyToken() {
    try {
      const token = this.getStoredToken();
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/api/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        ...this.getRequestConfig()
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        // Actualizar datos de usuario si han cambiado
        localStorage.setItem('teo-auth-user', JSON.stringify(result.user));
        return true;
      } else {
        // Token inválido, limpiar sesión
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  }

  // Hacer peticiones autenticadas a tus APIs
  async authenticatedRequest(endpoint, options = {}) {
    const token = this.getStoredToken();
    
    return fetch(`${this.baseUrl}${endpoint}`, this.getRequestConfig({
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    }));
  }

  // Utilidades para manejar sesión local
  storeSession(sessionData) {
    localStorage.setItem('teo-auth-session', JSON.stringify(sessionData));
    this.sessionData = sessionData;
  }

  getStoredSession() {
    const stored = localStorage.getItem('teo-auth-session');
    return stored ? JSON.parse(stored) : null;
  }

  getStoredToken() {
    return localStorage.getItem('teo-auth-token');
  }

  getStoredUser() {
    const stored = localStorage.getItem('teo-auth-user');
    return stored ? JSON.parse(stored) : null;
  }

  clearSession() {
    localStorage.removeItem('teo-auth-session');
    localStorage.removeItem('teo-auth-token');
    localStorage.removeItem('teo-auth-user');
    this.sessionData = null;
  }

  get currentUser() {
    return this.getStoredUser() || this.sessionData?.user || null;
  }

  get isAuthenticated() {
    return !!this.getStoredToken() && !!this.currentUser;
  }
}

// Ejemplo de uso desde tu aplicación en puerto 3001
// const teoAuth = new TeoAuthClient('http://localhost:3000');

// Ejemplo de uso (puedes descomentar para probar)
/*
async function loginExample() {
  const result = await teoAuth.authenticate('admin@ejemplo.com', 'password123');
  
  if (result.success) {
    console.log('✅ Login exitoso:', result.user);
    
    // Ahora puedes hacer peticiones autenticadas
    const usersResponse = await teoAuth.authenticatedRequest('/api/admin/users');
    const usersData = await usersResponse.json();
    console.log('👥 Usuarios:', usersData);
  } else {
    console.error('❌ Error de login:', result.error);
  }
}
*/

export { TeoAuthClient };