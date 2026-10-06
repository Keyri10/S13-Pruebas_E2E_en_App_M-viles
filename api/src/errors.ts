import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}

export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  readonly message: string;
}> {}

export class Forbidden extends Data.TaggedError("Forbidden")<{
  readonly message: string;
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  readonly message: string;
}> {}

export class Conflict extends Data.TaggedError("Conflict")<{
  readonly message: string;
}> {}

export class DbError extends Data.TaggedError("DbError")<{
  readonly message: string;
}> {}

export type AppError =
  | ValidationError
  | Unauthorized
  | Forbidden
  | NotFound
  | Conflict
  | DbError;

export function statusFor(error: AppError): number {
  switch (error._tag) {
    case "ValidationError":
      return 400;
    case "Unauthorized":
      return 401;
    case "Forbidden":
      return 403;
    case "NotFound":
      return 404;
    case "Conflict":
      return 409;
    case "DbError":
      return 500;
  }
}
