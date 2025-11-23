
/**
 * Simulates an email/SMS/WhatsApp dispatch service.
 * In a real application, this would call a backend endpoint (e.g., AWS SES, Twilio, SendGrid).
 */
export const sendSimulatedNotification = async (
    contact: string, 
    pin: string, 
    credits: number, 
    ref: string
): Promise<boolean> => {
    console.log(`[NOVA_ID_MAILER] Initiating send to ${contact}...`);
    
    // Simulate network latency for email delivery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`[NOVA_ID_MAILER] Success! Message: "Your NovaID Access PIN is ${pin}. Ref: ${ref}" sent to ${contact}`);
    return true;
};
