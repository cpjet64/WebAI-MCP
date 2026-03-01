import http from 'http';
import https from 'https';
import { URL } from 'url';

type HeaderInit = HeadersInit | Record<string, string | number | string[] | undefined>;

export class SimpleHeaders {
  private map: Map<string, string> = new Map();

  constructor(init?: HeaderInit) {
    if (init) {
      if (Array.isArray(init)) {
        for (const [k, v] of init as any) this.set(k, String(v));
      } else if (init instanceof SimpleHeaders) {
        for (const [k, v] of init.entries()) this.set(k, v);
      } else if (typeof init === 'object') {
        for (const k of Object.keys(init)) {
          const v = (init as any)[k];
          if (v === undefined) continue;
          if (Array.isArray(v)) this.set(k, v.join(', '));
          else this.set(k, String(v));
        }
      }
    }
  }

  append(name: string, value: string) {
    const key = name.toLowerCase();
    const prev = this.map.get(key);
    this.map.set(key, prev ? prev + ', ' + value : value);
  }

  set(name: string, value: string) {
    this.map.set(name.toLowerCase(), value);
  }

  get(name: string): string | null {
    const v = this.map.get(name.toLowerCase());
    return v === undefined ? null : v;
  }

  has(name: string): boolean {
    return this.map.has(name.toLowerCase());
  }

  delete(name: string) {
    this.map.delete(name.toLowerCase());
  }

  entries(): IterableIterator<[string, string]> {
    return this.map.entries();
  }

  keys(): IterableIterator<string> {
    return this.map.keys();
  }

  values(): IterableIterator<string> {
    return this.map.values();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

export class SimpleRequest {
  url: string;
  method: string;
  headers: SimpleHeaders;
  body?: any;
  signal?: AbortSignal | null;

  constructor(input: string | URL | { url: string; method?: string; headers?: any; body?: any; signal?: AbortSignal | null }, init?: RequestInit) {
    if (typeof input === 'string' || input instanceof URL) {
      this.url = String(input);
      this.method = (init?.method || 'GET').toUpperCase();
      this.headers = new SimpleHeaders(init?.headers as any);
      this.body = (init as any)?.body;
      this.signal = (init as any)?.signal ?? null;
    } else {
      this.url = input.url;
      this.method = (input.method || (init?.method ?? 'GET')).toUpperCase();
      this.headers = new SimpleHeaders(input.headers || init?.headers);
      this.body = input.body ?? (init as any)?.body;
      this.signal = input.signal ?? (init as any)?.signal ?? null;
    }
  }
}

export class SimpleResponse {
  private _body: Buffer;
  status: number;
  statusText: string;
  headers: SimpleHeaders;

  constructor(body: Buffer, init: { status: number; statusText?: string; headers?: NodeJS.Dict<string | string[]> }) {
    this._body = body;
    this.status = init.status;
    this.statusText = init.statusText || '';
    this.headers = new SimpleHeaders(init.headers as any);
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  async text(): Promise<string> {
    return this._body.toString('utf8');
  }

  async json(): Promise<any> {
    const t = await this.text();
    return t ? JSON.parse(t) : null;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buf = this._body;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

function toNodeHeaders(h: SimpleHeaders): http.OutgoingHttpHeaders {
  const out: http.OutgoingHttpHeaders = {};
  for (const [k, v] of h) out[k] = v;
  return out;
}

export default function testFetch(input: any, init?: any): Promise<SimpleResponse> {
  const req = new SimpleRequest(input, init);
  const url = new URL(req.url);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const headers = new SimpleHeaders(req.headers);
  if (!headers.has('accept')) headers.set('accept', '*/*');
  if (req.body && typeof req.body === 'object' && !(req.body instanceof Buffer) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const options: https.RequestOptions = {
    method: req.method,
    headers: toNodeHeaders(headers),
  };

  return new Promise<SimpleResponse>((resolve, reject) => {
    // Handle aborts
    const abortHandler = () => {
      const err: any = new Error('The operation was aborted');
      err.name = 'AbortError';
      reject(err);
    };
    if (req.signal) {
      if ((req.signal as any).aborted) return abortHandler();
      req.signal.addEventListener('abort', abortHandler, { once: true });
    }

    const nodeReq = client.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve(
          new SimpleResponse(body, {
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            headers: res.headers as any,
          })
        );
      });
    });

    nodeReq.on('error', (err) => reject(err));

    if (req.body != null) {
      if (Buffer.isBuffer(req.body)) nodeReq.write(req.body);
      else if (typeof req.body === 'string') nodeReq.write(req.body);
      else nodeReq.write(JSON.stringify(req.body));
    }
    nodeReq.end();
  });
}

