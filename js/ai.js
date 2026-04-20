/* ================================================
   V.6 Content OS — AI Module
   LLM integration with grounded prompting
   Supports: Gemini, OpenAI, Mock
   ================================================ */

window.V6AI = (function () {

  /* ─── Validate AI Response Shape ─── */
  function validateResponse(data) {
    if (!data || typeof data !== 'object') throw new Error('Response is not an object');
    if (!data.monthly_theme)              throw new Error('Missing: monthly_theme');
    if (!data.mood_and_tone)              throw new Error('Missing: mood_and_tone');
    if (!Array.isArray(data.campaign_tracks)) throw new Error('Missing: campaign_tracks array');
    if (data.campaign_tracks.length !== 3) throw new Error(`Expected 3 campaign tracks, got ${data.campaign_tracks.length}`);

    const total = data.campaign_tracks.reduce((s, t) => s + Number(t.content_ratio || 0), 0);
    if (total !== 100) {
      console.warn('[V6AI] content_ratio total is', total, '— normalizing to 100');
      // Auto-correct: normalize ratios proportionally
      data.campaign_tracks = data.campaign_tracks.map(t => ({
        ...t,
        content_ratio: Math.round((Number(t.content_ratio || 0) / total) * 100)
      }));
      // Fix rounding residual on first track
      const newTotal = data.campaign_tracks.reduce((s, t) => s + t.content_ratio, 0);
      data.campaign_tracks[0].content_ratio += (100 - newTotal);
    }

    // Validate palette
    if (!Array.isArray(data.mood_and_tone.palette) || data.mood_and_tone.palette.length < 2) {
      data.mood_and_tone.palette = ['#a68cff','#ff6c95','#81ecff','#fbbf24'];
    }
    return data;
  }

  /* --- Parse JSON Object from raw text --- */
  function extractJSON(text) {
    if (!text) throw new Error('Empty response');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      console.error('[V6AI] JSON Object not found. Raw:', text);
      throw new Error('No JSON object found in response');
    }
    const jsonStr = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('[V6AI] Parse Error. Snippet:', jsonStr.substring(0, 100));
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /* --- Parse JSON Array from raw text --- */
  function extractArray(text) {
    if (!text) throw new Error('Empty response');
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error('[V6AI] JSON Array not found. Raw:', text);
      throw new Error('No JSON array found in response');
    }
    const jsonStr = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('[V6AI] Array Parse Error. Snippet:', jsonStr.substring(0, 100));
      throw new Error('Failed to parse AI response as JSON array');
    }
  }

  /* ─── Gemini API Call ─── */
  async function callGemini(apiKey, systemPrompt, userPrompt) {
    const directApiKey = localStorage.getItem('v6_settings_apiKey');
    if (!directApiKey) {
      alert("❌ Security Alert: API Key is missing. Please enter your Gemini API Key in the Settings (Layer 0) before using AI features.");
      throw new Error('KEY_MISSING');
    }

    const map = V6Store.getLayerModels();
    // Default to Layer 0 if available, then global config geminiModel, then hardcode
    const model = map.layer0 || V6_CONFIG.geminiModel || 'gemini-1.5-pro';
    const isDeepThinking = V6Store.getDeepThinkingMode();

    if (isDeepThinking) {
      systemPrompt = "【DEEP THINKING MODE ACTIVE】\nYou must use Chain-of-Thought reasoning. Think step-by-step critically about the brand, the target audience, the current context, and then formulate the perfect strategy or content. Ensure your thought process is rigorously detailed before finalizing.\n\n" + systemPrompt;
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + directApiKey;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        temperature:     0.85,
        topP:            0.95,
        topK:            40,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      }
    };

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errData.error?.message || ''}`);
    }

    const result = await response.json();
    const text   = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    return extractJSON(text);
  }

  /* ─── OpenAI API Call ─── */
  async function callOpenAI(apiKey, systemPrompt, userPrompt) {
    const directApiKey = localStorage.getItem('v6_settings_apiKey');
    if (!directApiKey) {
      alert("❌ Security Alert: API Key is missing. Please enter your Gemini API Key in the Settings (Layer 0) before using AI features.");
      throw new Error('KEY_MISSING');
    }
    const url = 'https://api.openai.com/v1/chat/completions';

    const body = {
      model:       V6_CONFIG.openaiModel || 'gpt-4o',
      temperature: 0.85,
      max_tokens:  2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    };

    const response = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${directApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errData.error?.message || ''}`);
    }

    const result = await response.json();
    const text   = result?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');

    return extractJSON(text);
  }

  /* --- Batch Topics: parse array response --- */
  function extractTopicsArray(text) {
     return extractArray(text);
  }

  /**
   * Batch-generate suggested_topic for all ContentCards in one LLM request.
   * Returns a new array of cards with suggested_topic filled in.
   * @param {object} strategy — approved MonthlyStrategy
   * @param {ContentCard[]} cards — cards with suggested_topic: null
   * @returns {Promise<ContentCard[]>}
   */
  async function generateTopics(strategy, cards) {
    const apiKey  = window.V6Store.getApiKey();
    const config  = window.V6_CONFIG;

    console.log('[V6AI] Generating topics for', cards.length, 'cards — provider:', apiKey ? config.apiProvider : 'mock');

    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1200));
      const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
      const mockResults = config.getMockTopics(cards, strategy, lang);
      return applyTopics(cards, mockResults);
    }

    const system = config.buildTopicsSystemPrompt();
    const user   = config.buildTopicsUserPrompt(cards, strategy);

    let raw;
    try {
      if (config.apiProvider === 'openai') {
        raw = await callOpenAI(apiKey, system, user);
        // openAI returns object; for array we parse the string directly
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
        raw = extractTopicsArray(text);
      } else {
        // Gemini — reuse callGemini but capture array
        const map = V6Store.getLayerModels();
        const model = map.layer1 || config.geminiModel || 'gemini-1.5-flash';
        const isDeepThinking = false; // Layer 1 bypasses Deep Thinking by design to save tokens unless explicitly forced.

        if (isDeepThinking) {
          system = "【DEEP THINKING MODE ACTIVE】\nThink step-by-step carefully before outputting topics.\n\n" + system;
        }

        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
        const body  = {
          contents: [{ role: 'user', parts: [{ text: `${system}\n\n---\n\n${user}` }] }],
          generationConfig: { temperature: 0.8, topP: 0.92, maxOutputTokens: 4096 },
        };
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`API Error: ${res.status} ${errData.error?.message || ''}`);
        }
        const result = await res.json();
        const text   = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        raw = extractTopicsArray(text);
      }
    } catch (err) {
      console.warn('[V6AI] Topics generation failed, using mock:', err.message);
      const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
      const mockResults = config.getMockTopics(cards, strategy, lang);
      return applyTopics(cards, mockResults);
    }

    return applyTopics(cards, raw);
  }

  function applyTopics(cards, topicResults) {
    const mapTh = {};
    const mapEn = {};
    (topicResults || []).forEach(r => {
      if (r.id) {
        if (r.topic_th) mapTh[r.id] = r.topic_th;
        if (r.topic_en) mapEn[r.id] = r.topic_en;
        if (r.topic && !r.topic_th) {
          mapTh[r.id] = r.topic;
          mapEn[r.id] = r.topic;
        }
      }
    });
    return cards.map(c => ({
      ...c,
      topic_th: mapTh[c.id] || `โพสต์ ${c.track_name} — ${c.date}`,
      topic_en: mapEn[c.id] || `Post ${c.track_name} — ${c.date}`,
      suggested_topic: mapTh[c.id] || `โพสต์ ${c.track_name} — ${c.date}` // Fallback for existing components
    }));
  }

  /**
   * Layer 2: Specialized Tool Execution
   * Generates response for specific drawer tools (Hooks, Pains, etc.)
   */
  async function generateToolResponse(toolId, toolName, contextText) {
    const apiKey = localStorage.getItem('v6_settings_apiKey');
    if (!apiKey) {
      alert("❌ Security Alert: API Key is missing. Please enter your Gemini API Key in the Settings (Layer 0) before using AI features.");
      throw new Error('KEY_MISSING');
    }

    const map = V6Store.getLayerModels();
    const model = map.layer2 || V6_CONFIG.geminiModel || 'gemini-1.5-flash';
    
    const systemPrompt = `You are an expert Thai Copywriter for Deblu Thailand (footwear).
Tool Category: ${toolName} (ID: ${toolId})
Context from Editor: ${contextText || 'No context provided'}

Goal: Provide 3-5 creative, high-impact options for the user.
Tone: Natural, professional, persuasive Thai.
Output: Plain text with each option on a new line. No markdown formatting like ** or ## unless essential for emphasis. No preamble.`;

    const userPrompt = `Generate the best content for "${toolName}" using the brand bible and current context.`;

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
    const body = {
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
    };

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`API Error: ${res.status} ${errData.error?.message || ''}`);
    }
    const result = await res.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /* ─── Main Generate Function ─── */
  /**
   * Generate a monthly strategy from LLM or mock.
   * @param {object} params - { month, products, events }
   * @returns {Promise<object>} Validated AI response object
   */
  async function generate({ month, products, events }) {
    const config   = window.V6_CONFIG;
    const apiKey   = window.V6Store.getApiKey();
    const provider = config.apiProvider;

    const systemPrompt = config.buildSystemPrompt();
    const userPrompt   = config.buildUserPrompt(month, products, events);

    console.log('[V6AI] Generating strategy for:', month, products, events);
    console.log('[V6AI] Provider:', apiKey ? provider : 'mock (no API key)');

    // If no API key, always use mock
    if (!apiKey) {
      console.warn('[V6AI] No API key found — using mock response');
      await new Promise(r => setTimeout(r, 1800)); // Simulate network delay
      const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
      const mock = config.getMockResponse(month, products, lang);
      return validateResponse(mock);
    }

    let raw;
    try {
      if (provider === 'openai') {
        raw = await callOpenAI(apiKey, systemPrompt, userPrompt);
      } else {
        // Default to Gemini
        raw = await callGemini(apiKey, systemPrompt, userPrompt);
      }
    } catch (err) {
      console.error('[V6AI] API call failed, falling back to mock:', err.message);
      // Graceful fallback to mock on error
      throw err; // Re-throw so UI can show the error + offer retry
    }

    return validateResponse(raw);
  }

  return { generate, generateTopics, generateToolResponse, callGemini };
})();

