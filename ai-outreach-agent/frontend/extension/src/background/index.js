// Background Service Worker

const API_URL = 'http://localhost:4000/api/v1';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GENERATE_EMAIL') {
    handleApiRequest('/extension/compose/generate', request.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.type === 'REWRITE_TEXT') {
    handleApiRequest('/extension/compose/rewrite', request.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (request.type === 'SUMMARIZE_THREAD') {
    handleApiRequest('/extension/thread/summarize', request.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function handleApiRequest(endpoint, payload) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // In a real extension, we would pass the auth token here.
      // For MVP, relying on cookies if domain matched or passing token from storage.
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`[Background] API request failed:`, error);
    throw error;
  }
}
