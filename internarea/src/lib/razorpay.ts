import Razorpay from "razorpay";

let instance: Razorpay | null = null;

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

export function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }
  if (!instance) {
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return instance;
}
