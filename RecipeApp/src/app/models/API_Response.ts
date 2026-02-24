export interface ApiError {
  message: string;
  field?: string;
  errors?: string[];
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}