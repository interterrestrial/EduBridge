import { ApiError, throwIfMissing } from '../utils/apiError';

describe('apiError utils', () => {
  it('throws ApiError(400) when a field is missing', () => {
    expect(() => throwIfMissing({ a: undefined, b: 'x' })).toThrow(ApiError);
    expect(() => throwIfMissing({ a: undefined })).toThrow(/Missing required field\(s\): a/);
  });
  it('does not throw when all fields present', () => {
    expect(() => throwIfMissing({ a: 1, b: 'y' })).not.toThrow();
  });
});
