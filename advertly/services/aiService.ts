// AI API Service - Frontend komunikace s backend AI endpoints

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Progress callback type for SSE
type ProgressCallback = (step: number, progress: number, message: string) => void;

export class AIService {
  private token: string | null = null;

  constructor() {
    // Inicializace tokenu z localStorage při startu
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    // Get token from instance or from localStorage as fallback
    const token = this.token || localStorage.getItem('token');
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const hasToken = !!token;
    const tokenLength = token ? token.length : 0;
    console.log(`[AIService] ${method} ${endpoint}`);
    console.log(`[AIService] Token: ${hasToken ? `YES (length: ${tokenLength})` : 'NO'}`);
    console.log(`[AIService] Authorization header set: ${(options.headers as any)['Authorization'] ? 'YES' : 'NO'}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.details || error.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      console.error(`[AIService] Error ${response.status}:`, errorMessage);
      console.error(`[AIService] Request had token: ${hasToken ? 'YES' : 'NO'}`);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // NEW: Generate strategy with Server-Sent Events for real-time progress
  async generateFromOnboardingWithProgress(
    onboardingData: any, 
    onProgress: ProgressCallback
  ): Promise<any> {
    const token = this.token || localStorage.getItem('token');
    
    // Encode onboarding data as base64 for query string
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(onboardingData))));
    
    // Try with auth first, fall back to public endpoint if no token
    if (token) {
      console.log('[AIService] Using authenticated endpoint');
      return this.generateWithFetchStream(onboardingData, onProgress, true);
    } else {
      console.log('[AIService] No token found, using public endpoint');
      return this.generateWithFetchStream(onboardingData, onProgress, false);
    }
  }

  // Alternative: Use fetch with readable stream for SSE (supports auth headers)
  private async generateWithFetchStream(
    onboardingData: any,
    onProgress: ProgressCallback,
    isAuthenticated: boolean = false
  ): Promise<any> {
    const token = this.token || localStorage.getItem('token');
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(onboardingData))));
    
    // Use public endpoint if not authenticated, otherwise use auth endpoint
    const endpoint = isAuthenticated ? '/api/ai/generate-stream' : '/api/ai/generate-stream-public';
    const url = `${API_BASE}${endpoint}?data=${encodedData}`;

    console.log(`[AIService] Starting fetch stream (${isAuthenticated ? 'authenticated' : 'public'})`);

    const headers: HeadersInit = {
      'Accept': 'text/event-stream',
    };

    // Add auth header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'progress') {
                onProgress(data.step, data.progress, data.message);
              } else if (data.type === 'complete') {
                result = data.data;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                console.warn('[AIService] Failed to parse SSE message:', line);
              } else {
                throw e;
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!result) {
      throw new Error('No result received from stream');
    }

    return result;
  }

  // Generate complete strategy with all components
  async generateCompleteStrategy(profile: any) {
    return this.request('/api/ai/generate-strategy', 'POST', { profile });
  }

  // Generate strategy from onboarding data (standard POST - fallback)
  async generateFromOnboarding(onboardingData: any) {
    return this.request('/api/ai/generate-from-onboarding', 'POST', { onboardingData });
  }

  // Generate just the marketing strategy
  async generateStrategy(profile: any) {
    return this.request('/api/ai/generate-strategy-only', 'POST', { profile });
  }

  // Generate Ideal Customer Profile
  async generateICP(profile: any) {
    return this.request('/api/ai/generate-icp', 'POST', { profile });
  }

  // Generate Ad Variants
  async generateAds(profile: any, strategy?: any) {
    return this.request('/api/ai/generate-ads', 'POST', { profile, strategy });
  }

  // Generate Landing Page Structure
  async generateLandingPage(profile: any, strategy?: any) {
    return this.request('/api/ai/generate-landing-page', 'POST', { profile, strategy });
  }

  // Analyze Market and Competitors
  async analyzeMarket(profile: any) {
    return this.request('/api/ai/analyze-market', 'POST', { profile });
  }

  // Chat with AI Onboarding Assistant
  async chatOnboarding(history: {role: string, content: string}[], currentProfileState: any) {
    return this.request('/api/ai/chat-onboarding', 'POST', {
        history,
        currentProfileState
    });
  }


  // Get all user's strategies
  async getStrategies() {
    return this.request('/api/strategies', 'GET');
  }

  // Get single strategy
  async getStrategy(id: string) {
    return this.request(`/api/strategies/${id}`, 'GET');
  }

  // Update strategy
  async updateStrategy(id: string, updates: any) {
    return this.request(`/api/strategies/${id}`, 'PUT', updates);
  }

  // Delete strategy
  async deleteStrategy(id: string) {
    return this.request(`/api/strategies/${id}`, 'DELETE');
  }

  // Get user profile
  async getProfile(profileId: string) {
    return this.request(`/api/profiles/${profileId}`, 'GET');
  }

  // Update user profile
  async updateProfile(profileId: string, updates: any) {
    return this.request(`/api/profiles/${profileId}`, 'PUT', updates);
  }

  // Get all profiles
  async getProfiles() {
    return this.request('/api/profiles', 'GET');
  }
}

export const aiService = new AIService();
