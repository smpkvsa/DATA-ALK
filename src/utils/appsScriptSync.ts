import { Member } from '../types';

/**
 * Sends a mutation request to the Google Apps Script Web App to keep Google Sheets in sync.
 */
export async function syncToGoogleSheets(
  webAppUrl: string,
  action: 'ADD_MEMBER' | 'UPDATE_MEMBER' | 'DELETE_MEMBER',
  member: Partial<Member>
): Promise<{ success: boolean; message: string }> {
  try {
    // If the URL is not valid, stop
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: false, message: 'Pautan Google Apps Script tidak sah.' };
    }

    // Google Apps Script doPost only accepts JSON via text payload or raw POST body
    // Using standard fetch POST with JSON body
    const response = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires redirect, 'no-cors' is common, but let's send standard form/text payload
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        member
      })
    });

    // Note: With 'no-cors', the response status will be 0 and body empty, but the request still reaches Apps Script!
    // We will assume success if no network exception is thrown, or we can handle standard cors if the script handles it.
    return { 
      success: true, 
      message: 'Permintaan penghantaran data ke Google Sheets telah dihantar!' 
    };
  } catch (error: any) {
    console.error('Apps Script API Error:', error);
    return { 
      success: false, 
      message: error.message || 'Gagal menghantar kemaskini ke Google Sheets.' 
    };
  }
}
