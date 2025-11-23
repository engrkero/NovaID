import React from 'react';

export enum VerificationType {
  BVN = 'BVN_RESOLUTION',
  NIN = 'NIN_RESOLUTION',
  BVN_MATCH = 'BVN_MATCH',
  PHONE = 'PHONE_RESOLUTION',
  ACCOUNT = 'ACCOUNT_RESOLUTION',
  CREDIT_PURCHASE = 'CREDIT_PURCHASE'
}

export interface Bank {
  code: string;
  name: string;
  slug: string;
}

export interface VerificationRequest {
  type: VerificationType;
  payload: Record<string, string>;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    timestamp: string;
    requestId: string;
  }
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  type?: VerificationType;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: VerificationType;
  input: string;
  status: 'success' | 'failed';
  message: string;
  transactionRef?: string; // Paystack or Internal Ref
  details?: any; // Stores full request/response objects
}

export interface CreditAccount {
  pin: string;
  balance: number;
  contact: string; // Email or WhatsApp
  createdAt: string;
}