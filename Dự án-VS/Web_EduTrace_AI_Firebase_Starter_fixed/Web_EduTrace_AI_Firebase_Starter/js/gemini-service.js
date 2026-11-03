/**
 * EduTrace AI - Google Gemini API Service Client
 * Handles API key management, model selection, connectivity testing,
 * structured assessment generation, and multi-turn conversational chat.
 * Enriched with clinical branch routing and medical disclaimers.
 */

class EduTraceGeminiService {
  constructor() {
    this.STORAGE_KEY_API = 'edutrace_gemini_api_key';
    this.STORAGE_KEY_MODEL = 'edutrace_gemini_model';
    this.DEFAULT_MODEL = 'gemini-1.5-flash';
    this.API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    this.supportedModels = [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Tốc độ cao, Khuyên dùng)', isDefault: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Thế hệ mới)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Lập luận y khoa chuyên sâu)' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' }
    ];
  }

  getApiKey() {
    if (window.edutraceGeminiCloud) return '';
    return (localStorage.getItem(this.STORAGE_KEY_API) || '').trim();
  }

  setApiKey(key) {
    if (window.edutraceGeminiCloud) throw new Error('Khóa Gemini được quản lý trên máy chủ.');
    const cleaned = (key || '').trim();
    if (cleaned) {
      localStorage.setItem(this.STORAGE_KEY_API, cleaned);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_API);
    }
    this.dispatchStatusChange();
    return Boolean(cleaned);
  }

  getModel() {
    if (window.edutraceGeminiCloud) return 'gemini-1.5-flash';
    const saved = localStorage.getItem(this.STORAGE_KEY_MODEL);
    return this.supportedModels.some(model => model.id === saved) ? saved : this.DEFAULT_MODEL;
  }

  setModel(modelId) {
    const valid = this.supportedModels.some(m => m.id === modelId);
    const target = valid ? modelId : this.DEFAULT_MODEL;
    localStorage.setItem(this.STORAGE_KEY_MODEL, target);
    this.dispatchStatusChange();
    return target;
  }

  isConfigured() {
    if (window.edutraceGeminiCloud) return window.edutraceGeminiCloud.available;
    return Boolean(this.getApiKey());
  }

  dispatchStatusChange() {
    const event = new CustomEvent('edutrace:gemini-status-changed', {
      detail: {
        isConfigured: this.isConfigured(),
        model: this.getModel()
      }
    });
    window.dispatchEvent(event);
  }

  async testConnection(testKey = null, testModel = null) {
    if (window.edutraceGeminiCloud) {
      const start = performance.now();
      try {
        const message = await window.edutraceGeminiCloud.generate([{ role: 'user', text: 'Xin chào' }]);
        if (typeof message !== 'string' || !message.trim()) return { success: false, error: 'Gemini không trả về nội dung.' };
        return { success: true, latencyMs: Math.round(performance.now() - start), message: message.trim() };
      } catch (error) { return { success: false, error: error.message }; }
    }
    const key = (testKey !== null ? testKey : this.getApiKey()).trim();
    const model = testModel || this.getModel();

    if (!key) {
      return {
        success: false,
        error: 'Chưa có Google Gemini API Key. Vui lòng nhập key từ aistudio.google.com'
      };
    }

    const startTime = performance.now();
    const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Xin chào, phản hồi ngắn gọn: "EduTrace AI Kết nối thành công!".' }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 60
          }
        })
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let errorDetail = `Lỗi HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error?.message) {
            errorDetail = errJson.error.message;
          }
        } catch (_) {}
        return {
          success: false,
          latencyMs,
          error: errorDetail
        };
      }

      const data = await response.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!replyText) return { success: false, latencyMs, error: 'Gemini không trả về nội dung.' };

      return {
        success: true,
        latencyMs,
        message: replyText
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra lại mạng.'
      };
    }
  }

  async analyzeAssessment(userInput) {
    const MANDATORY_DISCLAIMER = 'chat box Ai chỉ là công cụ hỗ trợ và có thể mắc sai sót';
    let result = null;

    if (window.edutraceGeminiCloud) {
      const raw = await window.edutraceGeminiCloud.generate([{ role: 'user', text: userInput }], 'assessment');
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      result = JSON.parse(cleaned);
    } else {
      const key = this.getApiKey();
      if (!key) throw new Error('MISSING_API_KEY');

      if (window.waitForEduTraceKnowledge) await window.waitForEduTraceKnowledge();
      const model = this.getModel();
      const systemPrompt = window.buildFullSystemPrompt ? window.buildFullSystemPrompt('assessment') : '';
      const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [{ text: `Tình trạng phụ huynh chia sẻ về con: "${userInput}"\n\nHãy phân tích và trả về định dạng JSON theo đúng hướng dẫn.` }]
        }],
        generationConfig: { maxOutputTokens: 1200 }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errMsg = `Lỗi ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) errMsg = errData.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        else throw new Error('Gemini không trả về đúng định dạng JSON yêu cầu.');
      }
    }

    if (!result.clinicalBranch) {
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('tự kỷ') || lowerInput.includes('asd') || lowerInput.includes('stimming') || lowerInput.includes('vỗ tay')) {
        result.clinicalBranch = 'asd';
      } else if (lowerInput.includes('tăng động') || lowerInput.includes('adhd') || lowerInput.includes('ngồi yên')) {
        result.clinicalBranch = 'adhd';
      } else if (lowerInput.includes('xúc giác') || lowerInput.includes('sensory') || lowerInput.includes('cắt móng')) {
        result.clinicalBranch = 'sensory';
      } else {
        result.clinicalBranch = 'speech';
      }
    }

    if (result.advice && !result.advice.includes('[clinical-test:')) {
      result.advice = `[clinical-test:${result.clinicalBranch}]\n\n` + result.advice;
    }

    if (result.advice && !result.advice.toLowerCase().includes('chat box ai chỉ là công cụ hỗ trợ')) {
      result.advice = result.advice.trim() + '\n\n' + MANDATORY_DISCLAIMER;
    }

    return result;
  }

  async sendChatMessage(userMessage, history = []) {
    const MANDATORY_DISCLAIMER = 'chat box Ai chỉ là công cụ hỗ trợ và có thể mắc sai sót';
    let reply = '';

    if (window.edutraceGeminiCloud) {
      const messages = history.slice(-19).map(item => ({ role: item.role === 'user' ? 'user' : 'model', text: String(item.text || item.content || '') }));
      messages.push({ role: 'user', text: userMessage });
      reply = await window.edutraceGeminiCloud.generate(messages);
    } else {
      const key = this.getApiKey();
      if (!key) throw new Error('MISSING_API_KEY');

      if (window.waitForEduTraceKnowledge) await window.waitForEduTraceKnowledge();
      const model = this.getModel();
      const systemPrompt = window.buildFullSystemPrompt ? window.buildFullSystemPrompt('chat') : '';
      const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

      const formattedContents = [];
      history.forEach(item => {
        formattedContents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content || item.text }]
        });
      });
      formattedContents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errMsg = `Lỗi ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) errMsg = errData.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!reply) throw new Error('Không nhận được phản hồi từ AI.');
    }

    if (!reply.toLowerCase().includes('chat box ai chỉ là công cụ hỗ trợ')) {
      reply += '\n\n' + MANDATORY_DISCLAIMER;
    }

    return reply;
  }
}

window.geminiService = new EduTraceGeminiService();
