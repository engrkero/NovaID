// api/verify/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';
import { encrypt } from '../../src/utils/crypto';
import jwt from 'jsonwebtoken';

const SECUREID_BASE_URL = process.env.SECUREID_BASE_URL || 'https://secureidverify.ng/api/v1';
const SECUREID_API_KEY = process.env.SECUREID_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Simple rate limiter simulation for vercel serverless using memory (resets on cold start)
// In a true enterprise setup, use Vercel KV or Upstash Redis
const rateLimits: Record<string, { count: number, resetAt: number }> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. IP-Based Rate Limiting (Basic)
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (!rateLimits[ip] || now > rateLimits[ip].resetAt) {
        rateLimits[ip] = { count: 1, resetAt: now + 60000 }; // 1 minute window
    } else {
        rateLimits[ip].count++;
        if (rateLimits[ip].count > 10) { // Max 10 reqs per minute
            return res.status(429).json({ error: 'Too Many Requests' });
        }
    }

    // 2. Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = decoded.userId;

    const { type, payload, deviceFingerprint } = req.body;

    if (!['NIN', 'BVN'].includes(type)) {
        return res.status(400).json({ error: 'Unsupported verification type' });
    }

    try {
        // 3. Check Wallet Balance
        const { data: walletData, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (walletError || !walletData) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const VERIFICATION_COST = 50; // Cost per verification

        if (walletData.balance < VERIFICATION_COST) {
            return res.status(402).json({ error: 'Insufficient credits. Please fund your wallet.' });
        }

        // 4. Make Request to SecureIDVerify
        let externalRes;
        if (type === 'NIN') {
             externalRes = await fetch(`${SECUREID_BASE_URL}/ninVerification.verify`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${SECUREID_API_KEY}`
                 },
                 body: JSON.stringify(payload)
             });
        } else if (type === 'BVN') {
             externalRes = await fetch(`${SECUREID_BASE_URL}/bvnVerification.verify`, { // Example endpoint
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${SECUREID_API_KEY}`
                 },
                 body: JSON.stringify(payload)
             });
        }

        const verificationResult = externalRes ? await externalRes.json() : { success: false, message: "External API Error" };

        const isSuccess = externalRes && externalRes.ok && verificationResult.success !== false;

        // 5. Deduct Balance (Only if API call was successful or completed)
        // Note: You might want to deduct regardless if the API charges you.
        if (isSuccess) {
            const { error: deductError } = await supabaseAdmin.rpc('decrement_wallet_balance', {
                user_id_param: userId,
                amount_param: VERIFICATION_COST
            });
            // If we didn't have an RPC, we could do an update, but RPC is safer against race conditions.
            // For now, we'll do a simple update assuming low concurrency per user, or better yet, log a transaction.

            // Log Debit Transaction
             await supabaseAdmin.from('transactions').insert([{
                 user_id: userId,
                 type: 'debit',
                 amount: VERIFICATION_COST,
                 reference: `VERIFY_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                 description: `${type} Verification`,
                 status: 'success'
             }]);

            // Simple update as fallback
            await supabaseAdmin.from('wallets').update({ balance: walletData.balance - VERIFICATION_COST }).eq('user_id', userId);
        }

        // 6. Immutable Audit Log (Encrypted)
        const logDetails = {
            request: payload,
            response: verificationResult
        };

        await supabaseAdmin.from('audit_logs').insert([{
            user_id: userId,
            action_type: `${type}_VERIFICATION`,
            device_fingerprint: deviceFingerprint || 'unknown',
            status: isSuccess ? 'success' : 'failed',
            encrypted_details: encrypt(JSON.stringify(logDetails))
        }]);

        // 7. Return Result
        return res.status(200).json(verificationResult);

    } catch (error: any) {
        console.error("Verification Handler Error", error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
