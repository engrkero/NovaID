// api/auth/register.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, pin } = req.body;

    if (!email || !pin || pin.length !== 4) {
        return res.status(400).json({ error: 'Valid email and 4-digit PIN required' });
    }

    try {
        // 1. Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // 2. Hash the PIN securely
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // 3. Create Paystack Customer
        const paystackRes = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                first_name: "NovaID",
                last_name: "User"
            })
        });
        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
            return res.status(500).json({ error: 'Failed to create payment profile' });
        }

        const customerCode = paystackData.data.customer_code;

        // 4. Create Dedicated Virtual Account
        const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer: customerCode,
                preferred_bank: "wema-bank" // standard paystack test/live bank
            })
        });
        const dvaData = await dvaRes.json();

        let accountNumber = null;
        let bankName = null;

        if (dvaData.status && dvaData.data) {
            accountNumber = dvaData.data.account_number;
            bankName = dvaData.data.bank.name;
        }

        // 5. Save to Supabase
        const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([{
                email,
                encrypted_pin: hashedPin,
                paystack_customer_code: customerCode,
                virtual_account_number: accountNumber,
                virtual_account_bank: bankName,
                role: 'user'
            }])
            .select('id, role')
            .single();

        if (insertError) {
            console.error(insertError);
            return res.status(500).json({ error: 'Database error' });
        }

        const userId = newUser.id;
        const role = newUser.role;

        // 6. Create wallet
        await supabaseAdmin.from('wallets').insert([{ user_id: userId }]);

        // 7. Generate JWT Token
        const token = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '1d' });

        return res.status(201).json({ token, userId });

    } catch (e: any) {
         console.error("Registration Error", e);
         return res.status(500).json({ error: 'Internal server error' });
    }
}
