import { requireRole, resolveStudentId } from '../middleware/authorize';
import { ApiError } from '../utils/apiError';
import type { AuthRequest } from '../middleware/authenticate';

const mockReq = (user: AuthRequest['user'] | undefined, params = {}, body = {}): AuthRequest =>
  ({ user, params, body } as AuthRequest);

describe('requireRole', () => {
  const next = jest.fn();
  beforeEach(() => next.mockClear());

  it('403s when user role not allowed', () => {
    requireRole('teacher')(mockReq({ id: 's1', email: 'e', role: 'student' }), {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
  it('passes when role allowed', () => {
    requireRole('student')(mockReq({ id: 's1', email: 'e', role: 'student' }), {} as any, next);
    expect(next).toHaveBeenCalledWith(); // called with no args = success
  });
  it('401s when no user', () => {
    requireRole('student')(mockReq(undefined), {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

describe('resolveStudentId', () => {
  it('returns req.user.id for students (never body)', () => {
    const id = resolveStudentId(mockReq({ id: 'real-id', email: 'e', role: 'student' }, {}, { studentId: 'hacked-id' }));
    expect(id).toBe('real-id');
  });
  it('allows teacher override from params', () => {
    const id = resolveStudentId(mockReq({ id: 't1', email: 'e', role: 'teacher' }, { studentId: 's1' }), { allowTeacherOverride: true });
    expect(id).toBe('s1');
  });
  it('blocks teacher override when not allowed', () => {
    expect(() => resolveStudentId(mockReq({ id: 't1', email: 'e', role: 'teacher' }, { studentId: 's1' }))).toThrow(ApiError);
  });
});
