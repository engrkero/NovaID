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
        if (decoded.role !== 'admin') {
             return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });

        const { data: txs } = await supabaseAdmin.from('transactions').select('amount').eq('type', 'credit').eq('status', 'success');
        const totalInflow = txs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        const { count: vCount } = await supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true }).like('action_type', '%_VERIFICATION');

        return res.status(200).json({
            users: userCount || 0,
            totalInflow,
            verifications: vCount || 0
        });

    } catch (e) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
