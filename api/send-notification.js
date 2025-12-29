import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      loanOfficerEmail, 
      loanOfficerName,
      clientName,
      clientEmail,
      clientPhone,
      propertyAddress,
      quoteLabel,
      quoteType,
      shareId
    } = req.body;

    // Validate required fields
    if (!loanOfficerEmail || !clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quoteUrl = `https://www.cdmquotepro.com/quote/${shareId}`;
    const appUrl = 'https://www.cdmquotepro.com';
    const quoteTypeLabel = quoteType === 'home_equity' ? 'Home Equity' : 'Purchase/Refi';

    // Build client contact section if details available
    const hasContactInfo = clientEmail || clientPhone || propertyAddress;
    const contactSection = hasContactInfo ? `
                      <!-- Client Contact Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0e6f7; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #7B2CBF;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 12px; color: #7B2CBF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                              📋 Client Contact Info
                            </p>
                            ${clientEmail ? `<p style="margin: 0 0 6px; color: #333333; font-size: 14px;">📧 <a href="mailto:${clientEmail}" style="color: #7B2CBF; text-decoration: none;">${clientEmail}</a></p>` : ''}
                            ${clientPhone ? `<p style="margin: 0 0 6px; color: #333333; font-size: 14px;">📱 <a href="tel:${clientPhone}" style="color: #7B2CBF; text-decoration: none;">${clientPhone}</a></p>` : ''}
                            ${propertyAddress ? `<p style="margin: 0; color: #333333; font-size: 14px;">🏠 ${propertyAddress}</p>` : ''}
                          </td>
                        </tr>
                      </table>
    ` : '';

    const { data, error } = await resend.emails.send({
      from: 'CDM Quote Pro <notifications@cdmquotepro.com>',
      to: loanOfficerEmail,
      subject: `🔔 ${clientName} viewed your quote`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #7B2CBF 0%, #3C096C 100%); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                        🔔 Quote Viewed!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 24px; color: #333333; font-size: 16px; line-height: 1.5;">
                        Hi ${loanOfficerName || 'there'},
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #333333; font-size: 16px; line-height: 1.5;">
                        <strong>${clientName}</strong> just viewed the quote you sent them.
                      </p>
                      
                      ${contactSection}
                      
                      <!-- Quote Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 12px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 8px; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                              Quote Details
                            </p>
                            <p style="margin: 0 0 4px; color: #333333; font-size: 16px; font-weight: 600;">
                              ${quoteLabel || 'Quote'}
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 14px;">
                              ${quoteTypeLabel}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 24px; color: #666666; font-size: 14px; line-height: 1.5;">
                        Now is a great time to follow up while they're actively reviewing options!
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                              Open CDM Quote Pro
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e0e0e0; text-align: center;">
                      <p style="margin: 0; color: #888888; font-size: 12px;">
                        CDM Quote Pro • Client Direct Mortgage
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, messageId: data?.id });
    
  } catch (error) {
    console.error('Email notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
