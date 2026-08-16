import fpPromise from '@fingerprintjs/fingerprintjs';

// Initialize the agent at application startup.
let fpPromiseInstance: Promise<any> | null = null;

export const initFingerprint = () => {
    if (typeof window !== 'undefined' && !fpPromiseInstance) {
        fpPromiseInstance = fpPromise.load();
    }
};

export const getDeviceFingerprint = async (): Promise<string> => {
    try {
        if (!fpPromiseInstance) {
            initFingerprint();
        }
        const fp = await fpPromiseInstance;
        const result = await fp.get();
        return result.visitorId;
    } catch (e) {
        console.error("Error getting fingerprint", e);
        return "unknown_device_" + Math.random().toString(36).substring(7);
    }
};
