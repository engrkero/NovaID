import { GoogleGenAI, Type } from "@google/genai";
import { VerificationType, VerificationResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simulates Paystack/Identity APIs using Gemini to generate realistic dummy data.
 * In a real app, this would call the actual Paystack endpoints.
 */
export const verifyIdentity = async (
  type: VerificationType,
  payload: Record<string, string>
): Promise<VerificationResponse> => {
  
  const model = "gemini-2.5-flash";
  let prompt = "";
  let schema = null;

  // Common instruction for all requests
  const systemInstruction = `
    You are a high-performance Identity Verification API Simulator for Nigeria.
    You replace actual Paystack/NIBSS APIs for demonstration purposes.
    Generate REALISTIC, valid-looking synthetic data for Nigerian citizens.
    If the input looks blatantly invalid (e.g., '123' for BVN), return success: false.
    Current Date: ${new Date().toISOString()}
  `;

  switch (type) {
    case VerificationType.BVN:
      prompt = `Resolve BVN: ${payload.bvn}. Return full KYC details.`;
      schema = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING },
              lastName: { type: Type.STRING },
              middleName: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING },
              phoneNumber: { type: Type.STRING },
              registrationDate: { type: Type.STRING },
              enrollmentBank: { type: Type.STRING },
              bvn: { type: Type.STRING },
            },
          },
        },
      };
      break;

    case VerificationType.NIN:
      prompt = `Resolve NIN: ${payload.nin}. Return NIMC details.`;
      schema = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              firstName: { type: Type.STRING },
              surname: { type: Type.STRING },
              nin: { type: Type.STRING },
              gender: { type: Type.STRING },
              residenceAddress: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING },
              photo: { type: Type.STRING, description: "Use a placeholder URL like https://picsum.photos/200" }
            },
          },
        },
      };
      break;

    case VerificationType.PHONE:
      prompt = `Resolve Phone Number: ${payload.phone}. Simulate Truecaller SDK lookup for a Nigerian user.`;
      schema = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              callerName: { type: Type.STRING },
              carrier: { type: Type.STRING },
              countryCode: { type: Type.STRING },
              nationalFormat: { type: Type.STRING },
              spamScore: { type: Type.NUMBER },
              isSpam: { type: Type.BOOLEAN }
            }
          }
        }
      };
      break;

    case VerificationType.ACCOUNT:
      prompt = `Resolve Account Number: ${payload.accountNumber} for Bank Code: ${payload.bankCode}. Return account name.`;
      schema = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              accountNumber: { type: Type.STRING },
              accountName: { type: Type.STRING },
              bankId: { type: Type.INTEGER }
            }
          }
        }
      };
      break;

    case VerificationType.BVN_MATCH:
        prompt = `Check if BVN ${payload.bvn} matches Account ${payload.accountNumber} at Bank Code ${payload.bankCode}. Randomly decide match status but bias towards true.`;
        schema = {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              message: { type: Type.STRING },
              data: {
                type: Type.OBJECT,
                properties: {
                  isMatch: { type: Type.BOOLEAN },
                  fieldMatches: {
                      type: Type.OBJECT,
                      properties: {
                          lastName: { type: Type.BOOLEAN },
                          firstName: { type: Type.BOOLEAN }
                      }
                  }
                }
              }
            }
          };
        break;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text);
    return {
        ...parsed,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
        }
    };

  } catch (error) {
    console.error("Verification Error", error);
    return {
      success: false,
      message: "Verification failed due to connectivity issues.",
      meta: {
        timestamp: new Date().toISOString(),
        requestId: "error-req"
      }
    };
  }
};