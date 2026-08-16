// api/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).json({ error: 'Email and PIN are required' });
    }

    try {
        // 1. Fetch user by email
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, encrypted_pin, role')
            .eq('email', email)
            .maybeSingle();

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Verify PIN using bcrypt
        const isMatch = await bcrypt.compare(pin, user.encrypted_pin);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { userId: user.id, email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({ token, userId: user.id });

    } catch (e: any) {
         console.error("Login Error", e);
         return res.status(500).json({ error: 'Internal server error' });
    }
}
