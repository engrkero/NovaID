import { CreditAccount } from "../types";
import { initializePayment } from "./paystackService";

const CREDIT_STORAGE_KEY = 'novaid_credit_accounts';
const CREDIT_COST_PER_UNIT = 50; // 50 Naira per credit

const getAccounts = (): Record<string, CreditAccount> => {
    try {
        return JSON.parse(localStorage.getItem(CREDIT_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveAccounts = (accounts: Record<string, CreditAccount>) => {
    localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(accounts));
};

export const generateUniquePin = (): string => {
    const accounts = getAccounts();
    let pin = '';
    do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (accounts[pin]);
    return pin;
};

export const purchaseCredits = (
    amount: number, 
    contact: string, 
    onSuccess: (pin: string, ref: string) => void,
    onCancel: () => void
) => {
    const cost = amount * CREDIT_COST_PER_UNIT * 100; // Convert to Kobo

    initializePayment(
        cost,
        contact,
        (paystackResponse) => {
            const pin = generateUniquePin();
            const accounts = getAccounts();
            
            accounts[pin] = {
                pin,
                balance: amount,
                contact,
                createdAt: new Date().toISOString()
            };
            
            saveAccounts(accounts);
            onSuccess(pin, paystackResponse.reference);
        },
        onCancel
    );
};

export const validatePin = (pin: string): CreditAccount | null => {
    const accounts = getAccounts();
    return accounts[pin] || null;
};

export const deductCredit = (pin: string): boolean => {
    const accounts = getAccounts();
    const account = accounts[pin];

    if (!account || account.balance < 1) {
        return false;
    }

    account.balance -= 1;
    saveAccounts(accounts);
    return true;
};

export const getBalance = (pin: string): number => {
    const accounts = getAccounts();
    return accounts[pin]?.balance || 0;
};