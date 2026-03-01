import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse 
} from '../setup';
import nock from 'nock';
import storageDataFixture from '../fixtures/storage-data.json';

describe('Storage Tools', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getCookies', () => {
    it('should retrieve cookies successfully', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.cookies);
      
      nock('http://127.0.0.1:3025')
        .get('/cookies')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/cookies');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(result.data[0]).toMatchObject({
        name: 'session_id',
        value: 'abc123def456',
        domain: '.example.com'
      });
    });

    it('should validate cookie structure', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.cookies);
      
      nock('http://127.0.0.1:3025')
        .get('/cookies')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/cookies');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      result.data.forEach((cookie: any) => {
        expect(cookie).toHaveProperty('name');
        expect(cookie).toHaveProperty('value');
        expect(cookie).toHaveProperty('domain');
        expect(cookie).toHaveProperty('path');
        expect(cookie).toHaveProperty('httpOnly');
        expect(cookie).toHaveProperty('secure');
        expect(cookie).toHaveProperty('sameSite');
        
        // Validate sameSite values
        expect(['Strict', 'Lax', 'None']).toContain(cookie.sameSite);
        
        // Validate boolean fields
        expect(typeof cookie.httpOnly).toBe('boolean');
        expect(typeof cookie.secure).toBe('boolean');
      });
    });

    it('should handle empty cookies', async () => {
      const mockResponse = createMockApiResponse([]);
      
      nock('http://127.0.0.1:3025')
        .get('/cookies')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/cookies');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle cookies retrieval error', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to retrieve cookies');
      
      nock('http://127.0.0.1:3025')
        .get('/cookies')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/cookies');
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve cookies');
    });

    it('should analyze cookie security', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.cookies);
      
      nock('http://127.0.0.1:3025')
        .get('/cookies')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/cookies');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const cookies = result.data;
      
      // Analyze security attributes
      const secureCookies = cookies.filter((cookie: any) => cookie.secure);
      const httpOnlyCookies = cookies.filter((cookie: any) => cookie.httpOnly);
      const strictSameSite = cookies.filter((cookie: any) => cookie.sameSite === 'Strict');
      
      expect(secureCookies.length).toBeGreaterThan(0);
      expect(httpOnlyCookies.length).toBeGreaterThan(0);
      expect(strictSameSite.length).toBeGreaterThan(0);
      
      // Check for potential security issues
      const insecureCookies = cookies.filter((cookie: any) => !cookie.secure && cookie.sameSite === 'None');
      // Should have at least one insecure cookie in our test data
      expect(insecureCookies.length).toBeGreaterThan(0);
    });
  });

  describe('getLocalStorage', () => {
    it('should retrieve localStorage successfully', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.localStorage);
      
      nock('http://127.0.0.1:3025')
        .get('/local-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/local-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user_preferences');
      expect(result.data).toHaveProperty('session_token');
      expect(result.data).toHaveProperty('cart_items');
    });

    it('should handle JSON data in localStorage', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.localStorage);
      
      nock('http://127.0.0.1:3025')
        .get('/local-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/local-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      // Test parsing JSON values
      const userPreferences = JSON.parse(result.data.user_preferences);
      expect(userPreferences).toHaveProperty('theme', 'dark');
      expect(userPreferences).toHaveProperty('language', 'en');
      
      const cartItems = JSON.parse(result.data.cart_items);
      expect(Array.isArray(cartItems)).toBe(true);
      expect(cartItems[0]).toHaveProperty('id', 1);
      
      const featureFlags = JSON.parse(result.data.feature_flags);
      expect(featureFlags).toHaveProperty('newUI', true);
      expect(featureFlags).toHaveProperty('betaFeatures', false);
    });

    it('should handle empty localStorage', async () => {
      const mockResponse = createMockApiResponse({});
      
      nock('http://127.0.0.1:3025')
        .get('/local-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/local-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toHaveLength(0);
    });

    it('should handle localStorage retrieval error', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to retrieve localStorage');
      
      nock('http://127.0.0.1:3025')
        .get('/local-storage')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/local-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve localStorage');
    });
  });

  describe('getSessionStorage', () => {
    it('should retrieve sessionStorage successfully', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.sessionStorage);
      
      nock('http://127.0.0.1:3025')
        .get('/session-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/session-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('current_page');
      expect(result.data).toHaveProperty('scroll_position');
      expect(result.data).toHaveProperty('form_data');
    });

    it('should handle JSON data in sessionStorage', async () => {
      const mockResponse = createMockApiResponse(storageDataFixture.sessionStorage);
      
      nock('http://127.0.0.1:3025')
        .get('/session-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/session-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      // Test parsing JSON values
      const formData = JSON.parse(result.data.form_data);
      expect(formData).toHaveProperty('name', 'John Doe');
      expect(formData).toHaveProperty('email', 'john@example.com');
      
      const navigationHistory = JSON.parse(result.data.navigation_history);
      expect(Array.isArray(navigationHistory)).toBe(true);
      expect(navigationHistory).toContain('home');
      expect(navigationHistory).toContain('products');
      expect(navigationHistory).toContain('dashboard');
    });

    it('should handle empty sessionStorage', async () => {
      const mockResponse = createMockApiResponse({});
      
      nock('http://127.0.0.1:3025')
        .get('/session-storage')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/session-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toHaveLength(0);
    });

    it('should handle sessionStorage retrieval error', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to retrieve sessionStorage');
      
      nock('http://127.0.0.1:3025')
        .get('/session-storage')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/session-storage');
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve sessionStorage');
    });
  });

  describe('Storage Analysis', () => {
    it('should analyze storage usage patterns', async () => {
      const localStorageResponse = createMockApiResponse(storageDataFixture.localStorage);
      const sessionStorageResponse = createMockApiResponse(storageDataFixture.sessionStorage);
      
      nock('http://127.0.0.1:3025')
        .get('/local-storage')
        .reply(200, localStorageResponse)
        .get('/session-storage')
        .reply(200, sessionStorageResponse);

      const [localResponse, sessionResponse] = await Promise.all([
        fetch('http://127.0.0.1:3025/local-storage'),
        fetch('http://127.0.0.1:3025/session-storage')
      ]);
      
      const [localResult, sessionResult] = await Promise.all([
        localResponse.json(),
        sessionResponse.json()
      ]);
      
      expect(localResponse.ok).toBe(true);
      expect(sessionResponse.ok).toBe(true);
      
      // Analyze storage sizes
      const localStorageSize = JSON.stringify(localResult.data).length;
      const sessionStorageSize = JSON.stringify(sessionResult.data).length;
      
      expect(localStorageSize).toBeGreaterThan(0);
      expect(sessionStorageSize).toBeGreaterThan(0);
      
      // Analyze data types
      const localKeys = Object.keys(localResult.data);
      const sessionKeys = Object.keys(sessionResult.data);
      
      expect(localKeys.length).toBeGreaterThan(0);
      expect(sessionKeys.length).toBeGreaterThan(0);
      
      // Check for common patterns
      const hasUserData = localKeys.some(key => key.includes('user'));
      const hasSessionData = sessionKeys.some(key => key.includes('session') || key.includes('current'));
      
      expect(hasUserData).toBe(true);
      expect(hasSessionData).toBe(true);
    });
  });
});
