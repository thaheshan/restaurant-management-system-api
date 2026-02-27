mport { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id:    string;
    email: string;
    role:  string;
    name:  string;
  };
}

export interface JwtPayload {
  id:    string;
  email: string;
  role:  string;
  name:  string;
  iat?:  number;
  exp?:  number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?:   T;
  error?:  string;
  meta?:   PaginationMeta;
}

export interface PaginationMeta {
  total:    number;
  page:     number;
  limit:    number;
  pages:    number;
}

export interface PaginationQuery {
  page?:   string;
  limit?:  string;
  search?: string;
  sort?:   string;
  order?:  "asc" | "desc";
}
