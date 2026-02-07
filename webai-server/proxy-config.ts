/**
 * Proxy Configuration for WebAI Server
 * 
 * Handles proxy detection, configuration, and network requests
 * through corporate firewalls and proxy servers.
 */

import { URL } from 'url';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';

export interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
  noProxy?: string[];
  autoDetect?: boolean;
}

export interface NetworkConfig {
  proxy?: ProxyConfig;
  timeout?: number;
  retries?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export class ProxyManager {
  private config: NetworkConfig;
  private httpAgent?: Agent;
  private httpsAgent?: HttpsAgent;

  constructor(config: NetworkConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: 'WebAI-MCP/1.3.0',
      ...config
    };

    this.initializeAgents();
  }

  private initializeAgents(): void {
    if (this.config.proxy?.enabled) {
      this.setupProxyAgents();
    } else {
      this.setupDirectAgents();
    }
  }

  private setupProxyAgents(): void {
    const proxy = this.config.proxy!;
    
    if (proxy.protocol === 'http' || proxy.protocol === 'https') {
      this.setupHttpProxy();
    } else if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
      this.setupSocksProxy();
    }
  }

  private setupHttpProxy(): void {
    const proxy = this.config.proxy!;
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    
    try {
      // Try to use HttpsProxyAgent if available
      const { HttpsProxyAgent } = require('https-proxy-agent');
      const { HttpProxyAgent } = require('http-proxy-agent');
      
      this.httpAgent = new HttpProxyAgent(proxyUrl);
      this.httpsAgent = new HttpsProxyAgent(proxyUrl);
      
      console.log(`Configured HTTP/HTTPS proxy: ${proxyUrl}`);
    } catch (error) {
      console.warn('Proxy agent packages not available. Install https-proxy-agent for proxy support.');
      this.setupDirectAgents();
    }
  }

  private setupSocksProxy(): void {
    const proxy = this.config.proxy!;
    
    try {
      // Try to use SocksProxyAgent if available
      const { SocksProxyAgent } = require('socks-proxy-agent');
      const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
      
      this.httpAgent = new SocksProxyAgent(proxyUrl);
      this.httpsAgent = new SocksProxyAgent(proxyUrl);
      
      console.log(`Configured SOCKS proxy: ${proxyUrl}`);
    } catch (error) {
      console.warn('SOCKS proxy agent package not available. Install socks-proxy-agent for SOCKS support.');
      this.setupDirectAgents();
    }
  }

  private setupDirectAgents(): void {
    this.httpAgent = new Agent({
      keepAlive: true,
      timeout: this.config.timeout
    });
    
    this.httpsAgent = new HttpsAgent({
      keepAlive: true,
      timeout: this.config.timeout,
      rejectUnauthorized: true
    });
  }

  static detectSystemProxy(): ProxyConfig | null {
    // Check environment variables for proxy configuration
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    const noProxy = process.env.NO_PROXY || process.env.no_proxy;

    const proxyUrl = httpsProxy || httpProxy;
    
    if (!proxyUrl) {
      return null;
    }

    try {
      const url = new URL(proxyUrl);
      
      return {
        enabled: true,
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        username: url.username || undefined,
        password: url.password || undefined,
        noProxy: noProxy ? noProxy.split(',').map(s => s.trim()) : [],
        autoDetect: true
      };
    } catch (error) {
      console.warn(`Invalid proxy URL: ${proxyUrl}`);
      return null;
    }
  }

  shouldUseProxy(targetUrl: string): boolean {
    if (!this.config.proxy?.enabled) {
      return false;
    }

    const noProxy = this.config.proxy.noProxy || [];
    
    try {
      const url = new URL(targetUrl);
      const hostname = url.hostname;
      
      // Check if hostname is in no-proxy list
      for (const pattern of noProxy) {
        if (pattern === '*') {
          return false;
        }
        
        if (pattern.startsWith('.')) {
          // Domain suffix match
          if (hostname.endsWith(pattern) || hostname === pattern.slice(1)) {
            return false;
          }
        } else if (pattern.includes('*')) {
          // Wildcard match
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          if (regex.test(hostname)) {
            return false;
          }
        } else if (hostname === pattern) {
          // Exact match
          return false;
        }
      }
      
      // Check for localhost and private networks
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  getFetchOptions(targetUrl: string): RequestInit {
    const options: RequestInit = {
      headers: {
        'User-Agent': this.config.userAgent!,
        ...this.config.headers
      }
    };

    if (this.shouldUseProxy(targetUrl)) {
      const isHttps = targetUrl.startsWith('https:');
      (options as any).agent = isHttps ? this.httpsAgent : this.httpAgent;
    }

    return options;
  }

  async testConnectivity(testUrls: string[] = [
    'https://www.google.com',
    'https://httpbin.org/get',
    'https://api.github.com'
  ]): Promise<{ url: string; success: boolean; error?: string }[]> {
    const results = [];
    
    for (const url of testUrls) {
      try {
        const options = this.getFetchOptions(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        results.push({
          url,
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }

  updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeAgents();
  }

  getConfig(): NetworkConfig {
    return { ...this.config };
  }

  static createFromEnvironment(): ProxyManager {
    const systemProxy = ProxyManager.detectSystemProxy();
    
    const config: NetworkConfig = {
      timeout: parseInt(process.env.NETWORK_TIMEOUT || '30000'),
      retries: parseInt(process.env.NETWORK_RETRIES || '3'),
      userAgent: process.env.USER_AGENT || 'Browser-Tools-MCP/1.3.0'
    };

    if (systemProxy) {
      config.proxy = systemProxy;
      console.log('Detected system proxy configuration:', {
        host: systemProxy.host,
        port: systemProxy.port,
        protocol: systemProxy.protocol
      });
    }

    return new ProxyManager(config);
  }

  static async validateProxyConfig(config: ProxyConfig): Promise<{ valid: boolean; error?: string }> {
    if (!config.enabled) {
      return { valid: true };
    }

    if (!config.host || !config.port) {
      return { valid: false, error: 'Proxy host and port are required' };
    }

    if (config.port < 1 || config.port > 65535) {
      return { valid: false, error: 'Invalid proxy port number' };
    }

    if (!['http', 'https', 'socks4', 'socks5'].includes(config.protocol || 'http')) {
      return { valid: false, error: 'Unsupported proxy protocol' };
    }

    // Test connectivity
    try {
      const manager = new ProxyManager({ proxy: config, timeout: 5000 });
      const results = await manager.testConnectivity(['https://httpbin.org/get']);
      
      if (results.length > 0 && results[0].success) {
        return { valid: true };
      } else {
        return { valid: false, error: results[0]?.error || 'Proxy connectivity test failed' };
      }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Proxy test failed' };
    }
  }

  static getRecommendedSettings(): {
    corporate: NetworkConfig;
    home: NetworkConfig;
    development: NetworkConfig;
  } {
    return {
      corporate: {
        timeout: 60000,
        retries: 5,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        proxy: {
          enabled: true,
          autoDetect: true,
          noProxy: ['localhost', '127.0.0.1', '*.local', '*.internal']
        }
      },
      home: {
        timeout: 30000,
        retries: 3,
        userAgent: 'Browser-Tools-MCP/1.3.0',
        proxy: {
          enabled: false
        }
      },
      development: {
        timeout: 10000,
        retries: 1,
        userAgent: 'Browser-Tools-MCP-Dev/1.3.0',
        proxy: {
          enabled: false
        }
      }
    };
  }
}
