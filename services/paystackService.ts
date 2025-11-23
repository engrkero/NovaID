interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  onSuccess: (response: any) => void;
  onCancel: () => void;
}

export const initializePayment = (
    amountInKobo: number, 
    emailOrPhone: string,
    onSuccess: (response: any) => void, 
    onCancel: () => void
) => {
  // Use environment variable for key, or fallback for demo/dev if not set in environment
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_d34d34d34d34d34d34d34d34d34d34d34d34'; 
  
  // Ensure we have a valid-looking email for Paystack (even if user entered phone)
  const validEmail = emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@novaid.user`;
  
  const config: PaystackConfig = {
    key: publicKey,
    email: validEmail,
    amount: amountInKobo, 
    currency: 'NGN',
    ref: 'NOVA_' + Math.floor((Math.random() * 1000000000) + 1),
    onSuccess: (response) => {
      console.log("Payment complete", response);
      onSuccess(response);
    },
    onCancel: () => {
      console.log("Payment cancelled");
      onCancel();
    },
  };

  const handler = (window as any).PaystackPop && (window as any).PaystackPop.setup(config);
  
  if (handler) {
    handler.openIframe();
  } else {
    console.error("Paystack SDK not loaded");
    alert("Payment system not loaded. Please check your internet connection.");
    onCancel();
  }
};