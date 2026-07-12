import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Creates a middleware that validates req.body against a Zod schema.
 * Invalid input is rejected with 400 before touching any service logic.
 */
export declare function validateBody(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Creates a middleware that validates req.query against a Zod schema.
 */
export declare function validateQuery(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Creates a middleware that validates req.params against a Zod schema.
 */
export declare function validateParams(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map