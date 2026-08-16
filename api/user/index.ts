import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
        const userId = decoded.userId;

        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('virtual_account_number, virtual_account_bank')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { data: walletData, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (walletError || !walletData) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        return res.status(200).json({
            balance: walletData.balance,
            virtual_account_number: userData.virtual_account_number,
            virtual_account_bank: userData.virtual_account_bank
        });

    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
