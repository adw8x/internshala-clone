import { sendEmail } from "./mailer";
import { Plan } from "./plans";

interface InvoiceParams {
  to: string;
  name: string;
  plan: Plan;
  amountINR: number;
  paymentId: string;
  invoiceNumber: string;
  periodStart: Date;
  periodEnd: Date;
}

export async function sendInvoiceEmail(params: InvoiceParams) {
  const {
    to,
    name,
    plan,
    amountINR,
    paymentId,
    invoiceNumber,
    periodStart,
    periodEnd,
  } = params;

  const planLabel = plan.applicationsPerMonth === -1 ? "Unlimited" : String(plan.applicationsPerMonth);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#2563eb;color:#fff;padding:24px 32px">
        <h1 style="margin:0;font-size:20px">Internshala Clone - Payment Invoice</h1>
        <p style="margin:4px 0 0;opacity:.9">Thank you for your subscription, ${name}</p>
      </div>
      <div style="padding:24px 32px">
        <h2 style="margin:0 0 16px;font-size:16px;color:#111827">Invoice #${invoiceNumber}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 0;color:#6b7280">Plan</td>
            <td style="padding:8px 0;font-weight:600;text-align:right">${plan.name} Plan</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Description</td>
            <td style="padding:8px 0;text-align:right">${plan.description}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Application Limit</td>
            <td style="padding:8px 0;text-align:right">${planLabel} internship(s) / month</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Amount Paid</td>
            <td style="padding:8px 0;font-weight:600;text-align:right">₹${amountINR}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Payment ID</td>
            <td style="padding:8px 0;text-align:right">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Valid From</td>
            <td style="padding:8px 0;text-align:right">${new Date(periodStart).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Valid Until</td>
            <td style="padding:8px 0;text-align:right">${new Date(periodEnd).toLocaleString("en-IN")}</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:16px;background:#f3f4f6;border-radius:8px;font-size:13px;color:#374151">
          <strong>Note:</strong> Your plan renews on a monthly basis. To continue using the
          ${plan.name} plan, you will need to make a payment again before the validity period ends.
          Payments are only accepted between 10:00 AM and 11:00 AM IST.
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: `Your ${plan.name} Plan Invoice - ${invoiceNumber}`,
    text: `Thank you for subscribing to the ${plan.name} plan. Amount paid: Rs. ${amountINR}. Payment ID: ${paymentId}. Invoice: ${invoiceNumber}`,
    html,
  });
}
