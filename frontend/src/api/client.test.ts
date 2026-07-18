import { describe, expect, it } from 'vitest';
import { ApiError, api } from './client';

describe('ApiError', () => {
  // frob:tests frontend/src/api/client.ts::ApiError.constructor kind="unit"
  it('prefers the service error detail over message, then status', () => {
    const withDetail = new ApiError(422, {
      kind: 'validation',
      message: 'invalid input',
      detail: 'field foo must be positive',
    });
    expect(withDetail.message).toBe('field foo must be positive');
    expect(withDetail.status).toBe(422);
    expect(withDetail.name).toBe('ApiError');

    const withMessageOnly = new ApiError(404, { kind: 'not_found', message: 'no such project' });
    expect(withMessageOnly.message).toBe('no such project');

    const withNoBody = new ApiError(500, null);
    expect(withNoBody.message).toBe('request failed: 500');
    expect(withNoBody.body).toBeNull();
  });
});

describe('api.artifactUrl', () => {
  it('encodes the project and content hash into the artifact path', () => {
    expect(api.artifactUrl('examples.timber pavilion', 'blake3:abc/def')).toBe(
      '/api/projects/examples.timber%20pavilion/artifacts/blake3%3Aabc%2Fdef',
    );
  });
});
