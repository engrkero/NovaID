import { CreditAccount } from "../types";
import { initializePayment } from "./paystackService";

// This service mimics a reliable backend database using LocalStorage.
// In a production environment, this would verify transaction references with a server.

const CREDIT_STORAGE_KEY = 'novaid_db_accounts';
const CREDIT_COST_PER_UNIT = 50; // 50 Naira per credit

const getAccounts = (): Record<string, CreditAccount> => {
    try {
        const data = localStorage.getItem(CREDIT_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Database access error:", e);
        return {};
    }
};

const saveAccounts = (accounts: Record<string, CreditAccount>) => {
    try {
        localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
        console.error("Database write error:", e);
        alert("System Warning: Local storage is full. Your credits may not be saved.");
    }
};

/**
 * Generates a cryptographically strong-ish random 4 digit PIN
 * Ensures no collisions with existing PINs in the database.
 */
export const generateUniquePin = (): string => {
    const accounts = getAccounts();
    let pin = '';
    let attempts = 0;
    
    // Attempt to generate a unique 4-digit PIN
    do {
        // Generate random number between 1000 and 9999
        pin = Math.floor(1000 + Math.random() * 9000).toString();
        attempts++;
        if (attempts > 1000) {
            throw new Error("Unable to generate unique PIN. Database full?");
        }
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
            try {
                const pin = generateUniquePin();
                const accounts = getAccounts();
                
                // Transactional save
                accounts[pin] = {
                    pin,
                    balance: amount,
                    contact,
                    createdAt: new Date().toISOString()
                };
                
                saveAccounts(accounts);
                onSuccess(pin, paystackResponse.reference);
            } catch (error) {
                console.error("Post-payment error:", error);
                alert("Payment successful but PIN generation failed. Please contact support with Ref: " + paystackResponse.reference);
            }
        },
        onCancel
    );
};

export const validatePin = (pin: string): CreditAccount | null => {
    if (!pin || pin.length !== 4) return null;
    const accounts = getAccounts();
    return accounts[pin] || null;
};

export const deductCredit = (pin: string): boolean => {
    const accounts = getAccounts();
    const account = accounts[pin];

    if (!account) return false;
    
    if (account.balance < 1) {
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