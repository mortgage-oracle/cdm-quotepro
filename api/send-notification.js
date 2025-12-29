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

    const appUrl = 'https://www.cdmquotepro.com';
    const quoteTypeLabel = quoteType === 'home_equity' ? 'Home Equity' : 'Purchase/Refi';
    const firstName = clientName.split(' ')[0];

    // Build client contact section if details available
    const hasContactInfo = clientEmail || clientPhone || propertyAddress;
    const contactSection = hasContactInfo ? `
                      <!-- Client Contact Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="background-color: #f0e6f7; border-left: 4px solid #7B2CBF; padding: 16px;">
                            <p style="margin: 0 0 10px; color: #7B2CBF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; font-family: Arial, sans-serif;">
                              Client Contact Info
                            </p>
                            ${clientEmail ? `<p style="margin: 0 0 6px; color: #333333; font-size: 14px; font-family: Arial, sans-serif;">Email: <a href="mailto:${clientEmail}" style="color: #7B2CBF;">${clientEmail}</a></p>` : ''}
                            ${clientPhone ? `<p style="margin: 0 0 6px; color: #333333; font-size: 14px; font-family: Arial, sans-serif;">Phone: <a href="tel:${clientPhone}" style="color: #7B2CBF;">${clientPhone}</a></p>` : ''}
                            ${propertyAddress ? `<p style="margin: 0; color: #333333; font-size: 14px; font-family: Arial, sans-serif;">Address: ${propertyAddress}</p>` : ''}
                          </td>
                        </tr>
                      </table>
    ` : '';

    // Call Now button - bulletproof style for Outlook
    const callNowButton = clientPhone ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" width="260">
                              <tr>
                                <td align="center" bgcolor="#28a745" style="border-radius: 6px;">
                                  <a href="tel:${clientPhone}" target="_blank" style="display: block; padding: 14px 20px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: bold; font-family: Arial, sans-serif; text-align: center;">
                                    CALL ${firstName.toUpperCase()} NOW
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
    ` : '';

    const { data, error } = await resend.emails.send({
      from: 'CDM Quote Pro <notifications@cdmquotepro.com>',
      to: loanOfficerEmail,
      subject: `Quote Viewed: ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Quote Viewed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="500" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; width: 100%; background-color: #ffffff;">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" bgcolor="#7B2CBF" style="padding: 28px 20px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; font-family: Arial, sans-serif;">
                        Quote Viewed!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 28px 24px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 15px; line-height: 1.5; font-family: Arial, sans-serif;">
                        Hi ${loanOfficerName || 'there'},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #333333; font-size: 15px; line-height: 1.5; font-family: Arial, sans-serif;">
                        <strong>${clientName}</strong> just viewed the quote you sent them.
                      </p>
                      
                      ${contactSection}
                      
                      <!-- Quote Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="background-color: #f8f8f8; padding: 16px;">
                            <p style="margin: 0 0 6px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif;">
                              Quote Details
                            </p>
                            <p style="margin: 0 0 4px; color: #333333; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif;">
                              ${quoteLabel || 'Quote'}
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 13px; font-family: Arial, sans-serif;">
                              ${quoteTypeLabel}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 24px; color: #666666; font-size: 14px; line-height: 1.5; font-family: Arial, sans-serif;">
                        Now is a great time to follow up while they're actively reviewing options!
                      </p>
                      
                      ${callNowButton}
                      
                      <!-- Open App Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0" width="260">
                              <tr>
                                <td align="center" bgcolor="#7B2CBF" style="border-radius: 6px;">
                                  <a href="${appUrl}" target="_blank" style="display: block; padding: 14px 20px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: bold; font-family: Arial, sans-serif; text-align: center;">
                                    OPEN CDM QUOTE PRO
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 24px; border-top: 1px solid #e0e0e0; text-align: center;">
                      <p style="margin: 0; color: #888888; font-size: 12px; font-family: Arial, sans-serif;">
                        CDM Quote Pro - Client Direct Mortgage
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
