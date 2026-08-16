// api/paystack/webhook.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/lib/supabaseAdmin';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Validate Paystack Signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // 2. Handle Successful Charge
    if (event.event === 'charge.success') {
        const data = event.data;
        const amountInKobo = data.amount;
        const amountInNaira = amountInKobo / 100;
        const customerCode = data.customer.customer_code;
        const reference = data.reference;

        try {
            // Find user by customer code
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('paystack_customer_code', customerCode)
                .single();

            if (userError || !user) {
                console.error('Webhook: User not found for customer code', customerCode);
                return res.status(200).send('OK'); // Return 200 so Paystack doesn't retry
            }

            // Check if transaction already exists (idempotency)
            const { data: existingTx } = await supabaseAdmin
                .from('transactions')
                .select('id')
                .eq('reference', reference)
                .single();

            if (existingTx) {
                return res.status(200).send('OK'); // Already processed
            }

            // Insert Transaction
            await supabaseAdmin.from('transactions').insert([{
                user_id: user.id,
                type: 'credit',
                amount: amountInNaira,
                reference: reference,
                description: 'Wallet Funding via Virtual Account',
                status: 'success'
            }]);

            // Update Wallet Balance
            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            if (wallet) {
                await supabaseAdmin
                    .from('wallets')
                    .update({ balance: wallet.balance + amountInNaira })
                    .eq('user_id', user.id);
            }

            // Log Audit Event
             await supabaseAdmin.from('audit_logs').insert([{
                user_id: user.id,
                action_type: 'WALLET_FUNDED',
                device_fingerprint: 'paystack_webhook',
                status: 'success',
                encrypted_details: null // Or encrypt reference
            }]);

        } catch (e) {
            console.error('Webhook Error processing charge.success', e);
            // Even on error, return 200 if we want to stop retries, or 500 if we want retries.
            // Better to return 500 for critical DB failures.
            return res.status(500).send('Internal Server Error');
        }
    }

    res.status(200).send('OK');
}
