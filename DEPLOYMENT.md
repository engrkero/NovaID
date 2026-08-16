# NovaID Production Deployment Guide

This guide details how to deploy the NovaID platform in a production environment with enterprise-grade security, real database integration (Supabase), real API integrations (SecureIDVerify), and automated payment inflows via Paystack Dedicated Virtual Accounts.

## 1. Prerequisites

- **Vercel Account:** For deploying the frontend and serverless backend API.
- **Supabase Account:** For PostgreSQL database and row-level security.
- **Paystack Account:** For creating Dedicated Virtual Accounts and receiving payments.
- **SecureIDVerify Account:** For NIN and BVN resolution API credentials.

## 2. Database Setup (Supabase)

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open the `schema.sql` file provided in this repository.
4. Copy the entire contents of `schema.sql` and paste it into the Supabase SQL Editor.
5. Run the query. This will create:
   - `users` table
   - `wallets` table
   - `transactions` table
   - `audit_logs` table (with trigger enforcing immutability)
   - Row Level Security (RLS) policies.
6. Navigate to **Project Settings -> API** to get your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (use service role key for backend operations).

## 3. Environment Variables Configuration

Create a `.env` file in the root of your project for local development, and add these exact same variables to your Vercel project settings:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# SecureIDVerify Configuration
SECUREID_API_KEY=your_secureidverify_api_key
SECUREID_BASE_URL=https://secureidverify.ng/api/v1 # Update if different

# AES-256 Encryption Key
# Must be exactly 32 bytes (64 hex characters or a 32 character strong string)
ENCRYPTION_KEY=your_32_byte_strong_encryption_key_here

# Admin Master Password (used to log into the admin dashboard)
ADMIN_MASTER_PASSWORD=your_super_secure_admin_password
```

## 4. Paystack Webhook Configuration

To allow automated wallet funding via Dedicated Virtual Accounts:
1. Go to your **Paystack Dashboard** -> **Settings** -> **API Keys & Webhooks**.
2. Set your **Webhook URL** to: `https://your-vercel-domain.com/api/paystack/webhook`
3. Ensure you have the `PAYSTACK_SECRET_KEY` configured in Vercel. Our `/api/paystack/webhook` endpoint will automatically verify the signature and credit the user's wallet when a transfer is made to their Virtual Account.

## 5. Security & WAF Rules (Vercel)

The repository includes a `vercel.json` file which configures strict security headers.
To enable Vercel WAF (Web Application Firewall):
1. In your Vercel Dashboard, go to **Settings** -> **Security**.
2. Enable **Vercel WAF**.
3. Configure **Rate Limiting**: Set a rule to limit `/api/verify` to a maximum of 10 requests per minute per IP address to prevent brute-force or DDoS attacks on your credits.

## 6. Deployment to Vercel

1. Push your code to a GitHub repository.
2. Log into Vercel and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Framework Preset will automatically be detected as `Vite`.
5. Open **Environment Variables** and paste all the keys from Step 3.
6. Click **Deploy**.

## 7. Admin Dashboard Access

- Navigate to `/admin` (or click the hidden admin button if implemented on the UI).
- Use the email `admin@novaid.com` and the `ADMIN_MASTER_PASSWORD` to log in.
- From here, you can view Total Inflows, Users, and Immutable Audit Logs.

## 8. Verifying Immutable Audit Logs

- Any action performed on the platform is logged to the `audit_logs` table.
- A database-level trigger prevents any `UPDATE` or `DELETE` commands on this table.
- Sensitive PII (NIN, BVN, PINs) inside the logs are encrypted at rest using `AES-256-CBC` and the `ENCRYPTION_KEY` env variable. They are decrypted securely on the backend only when viewed by the admin.
