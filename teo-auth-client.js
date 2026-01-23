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

  // Login usando credentials provider
  async authenticate(email, password) {
    try {
      const csrfToken = await this.fetchCSRFToken();
      
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          password: password,
          csrfToken: csrfToken,
          json: 'true'
        })
      });

      if (loginResponse.ok) {
        const sessionInfo = await this.getCurrentSession();
        if (sessionInfo?.user) {
          this.storeSession(sessionInfo);
          return { success: true, user: sessionInfo.user };
        }
      }
      
      return { success: false, error: 'Credenciales incorrectas' };
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
      await fetch(`${this.baseUrl}/api/auth/signout`, {
        method: 'POST',
        ...this.getRequestConfig()
      });
      this.clearSession();
      return true;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      return false;
    }
  }

  // Hacer peticiones autenticadas a tus APIs
  async authenticatedRequest(endpoint, options = {}) {
    return fetch(`${this.baseUrl}${endpoint}`, this.getRequestConfig(options));
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

  clearSession() {
    localStorage.removeItem('teo-auth-session');
    this.sessionData = null;
  }

  get currentUser() {
    return this.sessionData?.user || null;
  }

  get isAuthenticated() {
    return !!this.currentUser;
  }
}

// Ejemplo de uso desde tu aplicación en puerto 3001
const teoAuth = new TeoAuthClient('http://localhost:3000');

// Uso
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

export { TeoAuthClient };