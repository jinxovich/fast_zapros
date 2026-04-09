// src/types/index.ts

export type RoleEnum =
  | 'user'
  | 'moderator'
  | 'admin'
  | 'pending_moderator'
  | 'pending_admin';
export type OrderStatusEnum = 'created' | 'in_transit' | 'arrived' | 'delivered';
export type SenderRoleEnum = 'user' | 'bot' | 'moderator';

export interface User {
  id: number;
  username: string;
  role: RoleEnum;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_role: SenderRoleEnum;
  content: string;
  created_at: string;
}

export interface Chat {
  id: number;
  user_id: number;
  is_bot_active: boolean;
  messages: Message[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Order {
  id: number;
  tracking_number: string;
  user_id: number;
  status: OrderStatusEnum;
  origin: string;
  destination: string;
  weight: number;
  created_at: string;
}