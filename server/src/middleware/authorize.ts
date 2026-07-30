import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { ApiError } from '../utils/apiError';

/**
 * Returns middleware that 403s unless req.user.role is in the allow-list.
 * Must be mounted AFTER `authenticate`.
 */
export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Unauthorized: authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, `Forbidden: requires role ${roles.join(' or ')}`));
      return;
    }
    next();
  };

/**
 * Resolves the "owner" studentId for an endpoint.
 *
 * - Students OWN their data: the studentId is taken from req.user.id (the JWT),
 *   NEVER from the request body or URL. This prevents IDOR.
 * - Teachers may act on any student: in that case studentId comes from req.body
 *   or req.params. The route must wrap this with requireRole('teacher').
 *
 * Usage:
 *   router.get('/student/me', authenticate, requireRole('student'), (req,res) => {
 *     const studentId = resolveStudentId(req, { allowTeacherOverride: false });
 *     ...
 *   });
 */
export function resolveStudentId(
  req: AuthRequest,
  opts: { allowTeacherOverride?: boolean } = {},
): string {
  const { allowTeacherOverride = false } = opts;
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized: authentication required');
  }
  if (req.user.role === 'student') {
    return req.user.id;
  }
  if (req.user.role === 'teacher') {
    const fromParams = req.params.studentId as string | undefined;
    const fromBody = req.body?.studentId as string | undefined;
    if (!allowTeacherOverride && (fromParams || fromBody)) {
      throw new ApiError(
        403,
        'Forbidden: teacher override not allowed on this endpoint',
      );
    }
    return fromParams || fromBody || req.user.id;
  }
  throw new ApiError(403, 'Forbidden: invalid role');
}
