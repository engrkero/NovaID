import { VerificationType, VerificationResponse } from '../../types';
import { getDeviceFingerprint } from '../utils/fingerprint';

const API_BASE = '/api';

export const verifyIdentity = async (
  type: VerificationType,
  payload: Record<string, string>,
  token: string
): Promise<VerificationResponse> => {
  try {
    const deviceFingerprint = await getDeviceFingerprint();

    const response = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: type.replace('_RESOLUTION', ''), payload, deviceFingerprint })
    });

    const data = await response.json();

    if (!response.ok) {
        return {
            success: false,
            message: data.error || 'Verification request failed',
            meta: { timestamp: new Date().toISOString(), requestId: 'err' }
        }
    }

    return {
        ...data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
        }
    };
  } catch (error: any) {
    console.error("Verification API Error", error);
    return {
      success: false,
      message: "Network or server error occurred.",
      meta: {
        timestamp: new Date().toISOString(),
        requestId: "error-req"
      }
    };
  }
};
