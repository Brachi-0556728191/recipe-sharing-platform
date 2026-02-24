export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;  // ? = optional
  address?: string;
  role: 1 | 2 | 3;  // רק הערכים האלה מותרים
  is_approved_uploader: boolean;
  pending_content_role_request: boolean;
  created_at?: string;
}

export interface UserStatus {
  logged_in: boolean;
  user_id?: number;
  username?: string;
  email?: string;
  role?: number;
}

export interface LoginCredentials {
  username: string;
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  address?: string;
}

export interface RegisterServerErrors {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface LoginServerErrors {
  username: '',
  email: '',
  password: ''
}
