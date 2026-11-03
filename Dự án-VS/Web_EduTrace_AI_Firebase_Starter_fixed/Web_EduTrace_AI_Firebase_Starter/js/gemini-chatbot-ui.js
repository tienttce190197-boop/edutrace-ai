/**
 * EduTrace AI - 24/7 Floating Gemini AI Chatbot Widget
 * Supports:
 * - Real-time conversational multi-turn chat with Google Gemini
 * - Local doctor knowledge fallback when API key is missing
 * - Embedded interactive exercise cards (calling openExerciseDetail)
 * - Quick prompt chips for common parent concerns
 * - Voice speech-to-text recognition
 * - Gemini API Key config integration
 */

class EduTraceChatbotUI {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.isGenerating = false;
    this.recognition = null;
    this.isRecording = false;

    this.init();
  }

  init() {
    // Chờ DOM sẵn sàng
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.mount());
    } else {
      this.mount();
    }
  }

  mount() {
    // Kiểm tra nếu đã có widget thì không render lại
    if (document.getElementById('edutraceChatWidget')) return;

    const widgetHTML = `
      <div id="edutraceChatWidget" class="edutrace-chat-widget">
        <!-- Nút kích hoạt nổi tròn -->
        <button id="chatWidgetTrigger" class="chat-widget-trigger" title="Mở Trợ lý AI Tham vấn 24/7" aria-label="Mở Trợ lý AI Tham vấn 24/7">
          <div class="chat-trigger-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="chat-trigger-pulse"></span>
          </div>
          <span class="chat-trigger-label">Trợ lý AI 24/7</span>
        </button>

        <!-- Khung cửa sổ Chat Drawer -->
        <div id="chatWidgetWindow" class="chat-widget-window">
          <!-- Chat Header -->
          <div class="chat-widget-header">
            <div class="chat-header-info">
              <div class="chat-avatar-wrap">
                <span class="chat-avatar-icon">🩺</span>
                <span class="chat-avatar-status"></span>
              </div>
              <div class="chat-header-text">
                <h4 class="chat-header-title">Trợ Lý AI EduTrace</h4>
                <p id="chatHeaderStatus" class="chat-header-subtitle">
                  <span class="status-dot"></span> Sẵn sàng lắng nghe cha mẹ
                </p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button id="btnChatOpenSettings" class="chat-header-btn" title="Cấu hình Gemini API Key" aria-label="Cài đặt API Key">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <button id="btnChatClose" class="chat-header-btn chat-close-btn" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Trạng thái Mode Badge -->
          <div id="chatEngineNotice" class="chat-engine-notice">
            <span id="chatEngineBadgeText" class="badge-text">⚡ Phác đồ Bác sĩ Nhi Cần Thơ</span>
            <button id="btnChatQuickSetup" class="link-btn">Kích hoạt Gemini AI</button>
          </div>

          <!-- Lịch sử hội thoại -->
          <div id="chatWidgetMessages" class="chat-widget-messages">
            <!-- Tin nhắn chào mừng mặc định -->
            <div class="chat-msg chat-msg-bot">
              <div class="chat-msg-avatar">🩺</div>
              <div class="chat-msg-bubble">
                <p>Chào ba mẹ! Em là <strong>Trợ lý AI EduTrace</strong>, được nạp kiến thức chuẩn từ các Bác sĩ Nhi khoa và Trung tâm Giáo dục Đặc biệt tại <strong>Quận Ninh Kiều, Cần Thơ</strong>.</p>
                <p style="margin-top: 6px;">Em có thể hỗ trợ ba mẹ:</p>
                <ul style="margin: 6px 0 6px 16px; padding: 0; font-size: 0.85rem; line-height: 1.5;">
                  <li>Giải đáp các thắc mắc về chậm nói, tự kỷ (ASD), tăng động (ADHD).</li>
                  <li>Hướng dẫn bài tập thực hành 3–5 phút tại nhà.</li>
                  <li>Cung cấp địa chỉ & hotline các phòng khám, trung tâm can thiệp uy tín ở Cần Thơ.</li>
                </ul>
                <p style="margin-top: 6px; font-size: 0.8rem; color: #64748b;"><em>Ba mẹ hãy gõ hoặc bấm các câu hỏi gợi ý bên dưới để bắt đầu nhé:</em></p>
              </div>
            </div>
          </div>

          <!-- Gợi ý nhanh (Quick Prompt Chips) -->
          <div class="chat-quick-chips" id="chatQuickChips">
            <button class="chat-chip" data-prompt="Bé rất sợ cắt móng tay và nhạy cảm xúc giác quá mức thì nên can thiệp thế nào?">💆 Bé nhạy cảm xúc giác &amp; Video</button>
            <button class="chat-chip" data-prompt="Hướng dẫn trò chơi Tạm dừng phát triển giao tiếp mắt và tài liệu theo dõi?">👀 Giao tiếp mắt &amp; Trò chơi tạm dừng</button>
            <button class="chat-chip" data-prompt="Bé 2 tuổi chưa nói được từ nào có phải dấu hiệu chậm nói không?">🗣️ Bé 2 tuổi chưa nói</button>
            <button class="chat-chip" data-prompt="Làm sao để giảm hành vi vỗ tay, lắc lư (stimming) cho bé tự kỷ?">🌿 Giảm hành vi Stimming</button>
            <button class="chat-chip" data-prompt="Giới thiệu các trung tâm can thiệp sớm và bác sĩ tâm lý uy tín tại Quận Ninh Kiều Cần Thơ?">🏥 Trung tâm tại Cần Thơ</button>
          </div>

          <!-- Thanh nhập liệu -->
          <div class="chat-widget-input-wrap">
            <form id="chatWidgetForm" class="chat-widget-form">
              <button type="button" id="btnChatVoice" class="chat-voice-btn" title="Nói để nhập liệu" aria-label="Nói để nhập liệu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
              <textarea 
                id="chatWidgetInput" 
                class="chat-widget-input" 
                placeholder="Nhập câu hỏi hoặc tâm sự của bạn về con..." 
                rows="1"
                aria-label="Nội dung câu hỏi"></textarea>
              <button type="submit" id="btnChatSend" class="chat-send-btn" title="Gửi câu hỏi" aria-label="Gửi câu hỏi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    this.attachEvents();
    this.updateEngineBadge();
    this.initVoiceInput();
  }

  attachEvents() {
    const trigger = document.getElementById('chatWidgetTrigger');
    const closeBtn = document.getElementById('btnChatClose');
    const form = document.getElementById('chatWidgetForm');
    const input = document.getElementById('chatWidgetInput');
    const quickSetup = document.getElementById('btnChatQuickSetup');
    const openSettings = document.getElementById('btnChatOpenSettings');
    const quickChips = document.querySelectorAll('.chat-chip');

    trigger?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.toggleChat(false));

    // Mở Modal Config Gemini
    const openConfigModal = () => {
      if (window.openGeminiConfigModal) {
        window.openGeminiConfigModal();
      } else {
        const key = prompt('Nhập Google Gemini API Key của bạn (miễn phí tại aistudio.google.com):', window.geminiService?.getApiKey() || '');
        if (key !== null) {
          window.geminiService?.setApiKey(key);
          this.updateEngineBadge();
        }
      }
    };

    quickSetup?.addEventListener('click', openConfigModal);
    openSettings?.addEventListener('click', openConfigModal);

    // Gửi form
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUserSubmit();
    });

    // Enter để gửi, Shift+Enter xuống dòng
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleUserSubmit();
      }
    });

    // Tự động giãn chiều cao textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    // Bấm chip gợi ý nhanh
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.dataset.prompt;
        if (promptText && input) {
          input.value = promptText;
          this.handleUserSubmit();
        }
      });
    });

    // Lắng nghe sự kiện đổi trạng thái Gemini
    window.addEventListener('edutrace:gemini-status-changed', () => {
      this.updateEngineBadge();
    });
  }

  toggleChat(forceState) {
    const chatWindow = document.getElementById('chatWidgetWindow');
    const trigger = document.getElementById('chatWidgetTrigger');
    if (!chatWindow) return;

    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;

    if (this.isOpen) {
      chatWindow.classList.add('active');
      trigger?.classList.add('hidden');
      setTimeout(() => {
        document.getElementById('chatWidgetInput')?.focus();
        this.scrollToBottom();
      }, 250);
    } else {
      chatWindow.classList.remove('active');
      trigger?.classList.remove('hidden');
    }
  }

  updateEngineBadge() {
    const notice = document.getElementById('chatEngineNotice');
    const badgeText = document.getElementById('chatEngineBadgeText');
    const quickSetup = document.getElementById('btnChatQuickSetup');
    const headerStatus = document.getElementById('chatHeaderStatus');
    const isConfigured = window.geminiService?.isConfigured();
    const model = window.geminiService?.getModel() || 'gemini-1.5-flash';

    if (!notice || !badgeText) return;

    if (isConfigured) {
      notice.className = 'chat-engine-notice active-gemini';
      badgeText.innerHTML = `🟢 Trực tiếp: <strong>${model}</strong>`;
      if (quickSetup) quickSetup.textContent = 'Đổi Model/Key';
      if (headerStatus) {
        headerStatus.innerHTML = `<span class="status-dot green"></span> Gemini AI Trực Tiếp (Nạp Tri Thức Cần Thơ)`;
      }
    } else {
      notice.className = 'chat-engine-notice offline-mode';
      badgeText.innerHTML = `⚡ Tri thức Bác sĩ Nhi Cần Thơ (Offline)`;
      if (quickSetup) quickSetup.textContent = 'Bật Gemini AI';
      if (headerStatus) {
        headerStatus.innerHTML = `<span class="status-dot orange"></span> Trợ lý Tri thức Y khoa & Bài tập Cần Thơ`;
      }
    }
  }

  initVoiceInput() {
    const voiceBtn = document.getElementById('btnChatVoice');
    const input = document.getElementById('chatWidgetInput');
    if (!voiceBtn || !input) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceBtn.title = 'Trình duyệt không hỗ trợ Web Speech API';
      voiceBtn.style.opacity = '0.5';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'vi-VN';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
      if (this.isRecording) {
        this.recognition.stop();
        return;
      }

      try {
        this.recognition.start();
        this.isRecording = true;
        voiceBtn.classList.add('recording');
        input.placeholder = 'Đang lắng nghe ba mẹ nói...';
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    });

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && input) {
        input.value = transcript;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        setTimeout(() => this.handleUserSubmit(), 300);
      }
    };

    this.recognition.onerror = () => {
      this.isRecording = false;
      voiceBtn.classList.remove('recording');
      input.placeholder = 'Nhập câu hỏi hoặc tâm sự của bạn về con...';
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      voiceBtn.classList.remove('recording');
      input.placeholder = 'Nhập câu hỏi hoặc tâm sự của bạn về con...';
    };
  }

  async handleUserSubmit() {
    const input = document.getElementById('chatWidgetInput');
    if (!input || this.isGenerating) return;

    const userText = input.value.trim();
    if (!userText) return;

    // Reset input
    input.value = '';
    input.style.height = 'auto';

    // Thêm tin nhắn của User vào giao diện
    this.appendMessage('user', userText);

    // Lưu vào history
    this.conversationHistory.push({ role: 'user', content: userText });

    // Hiển thị Typing indicator
    const typingEl = this.showTypingIndicator();
    this.isGenerating = true;

    try {
      let reply = '';
      if (window.geminiService && window.geminiService.isConfigured()) {
        // Gửi qua Gemini API thực
        reply = await window.geminiService.sendChatMessage(userText, this.conversationHistory.slice(0, -1));
      } else {
        // Fallback: Xử lý bằng Doctor Knowledge Engine có sẵn
        await new Promise(resolve => setTimeout(resolve, 800));
        reply = this.generateDoctorKnowledgeFallbackReply(userText);
      }

      this.removeTypingIndicator(typingEl);
      this.appendMessage('bot', reply);
      this.conversationHistory.push({ role: 'model', content: reply });
    } catch (err) {
      console.error('Lỗi phản hồi chatbot:', err);
      this.removeTypingIndicator(typingEl);

      let errorMsg = 'Xin lỗi ba mẹ, hệ thống gặp trục trặc khi kết nối Gemini. Em chuyển sang dùng kiến thức Bác sĩ Cần Thơ có sẵn nhé!';
      if (err.message === 'MISSING_API_KEY') {
        errorMsg = 'Ba mẹ chưa thiết lập Gemini API Key. Vui lòng bấm vào biểu tượng bánh răng ở góc trên để nhập key miễn phí từ Google AI Studio!';
      }
      this.appendMessage('bot', errorMsg);

      // Thử trả lời bằng Doctor Rules
      const fallbackReply = this.generateDoctorKnowledgeFallbackReply(userText);
      this.appendMessage('bot', fallbackReply);
      this.conversationHistory.push({ role: 'model', content: fallbackReply });
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Phản hồi bằng Doctor Rule Engine khi không có API Key
   * Tuân thủ nghiêm ngặt: Lấy đủ thông tin xác định nhánh bệnh -> cho làm bài test tương ứng -> không tự suy luận -> đính kèm tuyên bố miễn trừ
   */
  generateDoctorKnowledgeFallbackReply(userText) {
    const lower = userText.toLowerCase().trim();
    const MANDATORY_DISCLAIMER = 'chat box Ai chỉ là công cụ hỗ trợ và có thể mắc sai sót';

    // 0. Kiểm tra nếu thông tin quá ngắn hoặc mơ hồ -> Yêu cầu phụ huynh bổ sung thông tin
    if (lower.length < 8 || lower === 'alo' || lower === 'chào' || lower === 'xin chào' || lower === 'giúp tôi' || lower === 'con tôi bị sao') {
      return `Chào ba mẹ! Để Trợ lý AI có thể xác định chính xác nhánh bệnh và **chọn đúng bài test sàng lọc chuẩn y khoa** (M-CHAT-R/F, CARS, Denver II, Vanderbilt ADHD hay Sensory Profile), ba mẹ vui lòng chia sẻ thêm:
1. **Bé nhà mình hiện tại được bao nhiêu tháng/tuổi?**
2. **Những biểu hiện cụ thể của con khiến ba mẹ lo lắng?** (Ví dụ: bé chưa nói, gọi không quay đầu, hay vỗ tay lắc lư, khó ngồi yên, hay rất sợ cắt móng tay/tiếng ồn...)
3. **Các biểu hiện này xuất hiện từ khi nào?**

Ba mẹ cứ chia sẻ thoải mái nhé, em sẽ lắng nghe và kích hoạt bài test chuẩn y khoa phù hợp cho con ngay!

${MANDATORY_DISCLAIMER}`;
    }

    // 1. Tìm kiếm địa chỉ trung tâm tại Cần Thơ
    if (lower.includes('địa chỉ') || lower.includes('trung tâm') || lower.includes('phòng khám') || lower.includes('cần thơ') || lower.includes('ninh kiều') || lower.includes('bác sĩ')) {
      return `Dạ, tại **Quận Ninh Kiều, TP. Cần Thơ**, các cơ sở chuyên môn uy tín hàng đầu gồm:
1. **Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều** - Đường Nguyễn Văn Cừ nối dài (ĐT: 0292.389.1122): Chuyên sâu can thiệp bật âm đơn, trị liệu ngôn ngữ ABA.
2. **Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ** - Đường Nguyễn Tri Phương, P. An Khánh (ĐT: 0292.378.4455): Chuyên can thiệp ASD, rèn luyện giao tiếp mắt & PECS.
3. **Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều** - Đường Trần Hưng Đạo, P. An Phú (ĐT: 0292.381.8899): BS. CKI Lê Thanh Thảo khám chẩn đoán lâm sàng & phác đồ điều hòa cảm giác.
4. **Trường Dạy Trẻ Khuyết Tật Tương Lai Cần Thơ** - Đường 30/4, P. Xuân Khánh (ĐT: 0292.383.2266): Cơ sở giáo dục đặc biệt uy tín.
5. **Trung tâm Kỹ năng Rồng Việt Cần Thơ** - Đường Trần Văn Hoài (ĐT: 0292.373.9988): Chuyên can thiệp Tăng động giảm chú ý (ADHD).

Ba mẹ có thể đưa bé đến khám sàng lọc trực tiếp tại các địa chỉ trên nhé!

${MANDATORY_DISCLAIMER}`;
    }

    // 2. NHÁNH RỐI LOẠN ĐIỀU HÒA CẢM GIÁC (Sensory Processing / SI)
    if (lower.includes('xúc giác') || lower.includes('sensory') || lower.includes('cắt móng') || lower.includes('gội đầu') || lower.includes('quá tải âm thanh') || lower.includes('sợ tiếng ồn') || lower.includes('meltdown giác quan')) {
      return `Dạ ba mẹ, qua thông tin ba mẹ chia sẻ, các biểu hiện của bé hướng đến **Nhánh Rối Loạn Điều Hòa Cảm Giác (Sensory Processing Disorder - SI)** như nhạy cảm xúc giác hoặc quá tải thính giác.

Dựa trên tài liệu chuyên môn **Thang Đánh Giá Hồ Sơ Cảm Giác (Dunn Sensory Profile)** và phác đồ của **BS. CKI Lê Thanh Thảo (PK Nhi Đồng Ninh Kiều)**, em đề xuất ba mẹ thực hiện bài test sàng lọc chuẩn cảm giác dưới đây:

[clinical-test:sensory]

**Chỉ dẫn chăm sóc theo tài liệu y khoa:**
- Áp dụng kích thích áp lực sâu (Deep Pressure) trước khi tiếp xúc chất liệu lạ.
- Xem video hướng dẫn kỹ thuật massage tại [kn-video:dyn_kn_sensory_01] và tải cẩm nang điều hòa cảm giác [kn-doc:dyn_kn_sensory_01] để thực hành cùng con.
- Sau khi ba mẹ làm xong bài test, hệ thống sẽ gửi kết quả đồng thời đến các bác sĩ và cơ sở chuyên khoa để phản hồi sớm nhất cho gia đình.

${MANDATORY_DISCLAIMER}`;
    }

    // 3. NHÁNH RỐI LOẠN PHỔ TỰ KỶ (ASD / CARS / M-CHAT / ADOS-2)
    if (lower.includes('tự kỷ') || lower.includes('asd') || lower.includes('stimming') || lower.includes('vỗ tay') || lower.includes('lắc lư') || lower.includes('rập khuôn') || lower.includes('gọi không quay đầu') || lower.includes('không nhìn mắt') || lower.includes('không chỉ tay') || lower.includes('kiễng chân')) {
      return `Dạ ba mẹ yên tâm, qua mô tả về các dấu hiệu như giảm tương tác mắt, gọi ít quay đầu hoặc hành vi lặp lại (stimming), hệ thống xác định trường hợp của bé thuộc **Nhánh Nghi Ngờ Phổ Tự Kỷ (ASD)**.

Dựa trên các tài liệu y khoa chính thức: **Thang sàng lọc M-CHAT-R/F (16-30 tháng), Tiêu chuẩn chẩn đoán DSM-5, Thang CARS (Childhood Autism Rating Scale) và ADOS-2**, EduTrace AI kích hoạt bài test sàng lọc chuyên sâu dưới đây để lượng giá chính xác mức độ nguy cơ:

[clinical-test:asd]

**Khuyến nghị can thiệp dựa trên tài liệu:**
- Áp dụng bài tập **Kỹ thuật Chiếc kén bình yên & Massage áp lực sâu [ex-asd-01]** và **Lịch sinh hoạt bằng hình ảnh PECS [ex-asd-02]**.
- Xem video phát triển tương tác mắt [kn-video:dyn_kn_speech_02] và cẩm nang [kn-doc:dyn_kn_sensory_01].
- Tuyệt đối không quát mắng khi con đang stimming, hãy bình tĩnh đồng hành cùng bé.
- Ngay sau khi hoàn thành test, kết quả sẽ được gửi lên hệ thống đến tất cả bác sĩ chuyên khoa Nhi & GDĐB. Bác sĩ/phòng khám phản hồi sớm nhất sẽ được kết nối ưu tiên số 1 cho ba mẹ!

${MANDATORY_DISCLAIMER}`;
    }

    // 4. NHÁNH TĂNG ĐỘNG GIẢM CHÚ Ý (ADHD / Vanderbilt)
    if (lower.includes('tăng động') || lower.includes('chú ý') || lower.includes('adhd') || lower.includes('bồn chồn') || lower.includes('nghịch') || lower.includes('chạy nhảy') || lower.includes('mất tập trung') || lower.includes('xung động') || lower.includes('không ngồi yên')) {
      return `Chào ba mẹ, các biểu hiện bồn chồn, luôn chân luôn tay và khó duy trì tập trung của con thuộc **Nhánh Tăng Động Giảm Chú Ý (ADHD)**.

Dựa trên tài liệu y khoa chuẩn quốc tế **Thang Đánh Giá Hành Vi Trẻ Em NICHQ Vanderbilt & Tiêu Chuẩn DSM-5 ADHD**, em kích hoạt bài test sàng lọc chuyên biệt cho nhánh ADHD:

[clinical-test:adhd]

**Gợi ý rèn luyện theo tài liệu y khoa:**
- **Trò chơi "Đèn Xanh – Đèn Đỏ" [ex-adhd-01]**: Rèn luyện phanh hãm não bộ và khả năng ức chế hành vi bộc phát.
- **Kỹ thuật Thở bóng bay xoa dịu [ex-adhd-02]**: Hít thở sâu cơ hoành giúp con giải tỏa bồn chồn.
- **Chia nhỏ nhiệm vụ Pomodoro 3-5 phút [ex-adhd-03]** kết hợp đồng hồ cát trực quan.
- Khi làm xong test, toàn bộ bác sĩ và phòng khám sẽ nhận thông báo đồng thời để tiếp nhận hỗ trợ gia đình sớm nhất!

${MANDATORY_DISCLAIMER}`;
    }

    // 5. NHÁNH CHẬM PHÁT TRIỂN NGÔN NGỮ (Speech Delay / Denver II)
    return `Chào ba mẹ! Dựa trên các thông tin ba mẹ chia sẻ về việc bé chậm nói, vốn từ ít hoặc chưa ghép câu, hệ thống xác định con thuộc **Nhánh Chậm Phát Triển Ngôn Ngữ & Giao Tiếp (Speech Delay)**.

Dựa trên tài liệu chuẩn y khoa **Mốc Phát Triển Ngôn Ngữ & Vận Động Denver II (18 – 36 tháng)**, em kích hoạt bài test sàng lọc ngôn ngữ tương ứng để lượng giá vốn từ và khả năng hiểu ngôn ngữ của bé:

[clinical-test:speech]

**Bài tập can thiệp sớm tại nhà theo giáo trình:**
- **Thổi bong bóng xà phòng & Kích thích Bật âm đơn [ex-speech-01]**: Ngồi đối diện ngang tầm mắt để con quan sát khẩu hình miệng.
- **Trò chơi Ú òa qua gương cảm xúc [ex-speech-02]**: Kích thích tương tác ánh mắt và phản xạ gọi tên.
- **Dạy chỉ tay bằng Thẻ tranh PECS [ex-speech-03]**: Giúp con trao đổi nhu cầu thay vì khóc hoặc kéo tay mẹ.
- Ba mẹ có thể xem thêm video phát triển tương tác mắt tại [kn-video:dyn_kn_speech_02].
- Ngay sau khi ba mẹ nộp kết quả test, tất cả bác sĩ và phòng khám đối tác sẽ nhận được thông báo để phản hồi tư vấn cho con sớm nhất!

${MANDATORY_DISCLAIMER}`;
  }

  showTypingIndicator() {
    const messagesEl = document.getElementById('chatWidgetMessages');
    if (!messagesEl) return null;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg chat-msg-bot chat-typing';
    typingEl.innerHTML = `
      <div class="chat-msg-avatar">🩺</div>
      <div class="chat-msg-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesEl.appendChild(typingEl);
    this.scrollToBottom();
    return typingEl;
  }

  removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  appendMessage(role, text) {
    const messagesEl = document.getElementById('chatWidgetMessages');
    if (!messagesEl) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg chat-msg-${role === 'user' ? 'user' : 'bot'}`;

    const formattedContent = this.formatMessageText(text);

    if (role === 'user') {
      msgEl.innerHTML = `
        <div class="chat-msg-bubble">
          <p>${this.escapeHTML(text).replace(/\n/g, '<br>')}</p>
        </div>
      `;
    } else {
      msgEl.innerHTML = `
        <div class="chat-msg-avatar">🩺</div>
        <div class="chat-msg-bubble">
          ${formattedContent}
        </div>
      `;
    }

    messagesEl.appendChild(msgEl);
    this.scrollToBottom();
  }

  formatMessageText(text) {
    if (!text) return '';

    let processed = text;

    // 0. Nhận diện mã bài test chuẩn y khoa [clinical-test:BRANCH]
    const clinicalTestRegex = /\[clinical-test:(asd|speech|adhd|sensory)\]/gi;
    let testBranchMatch = null;
    let tMatch;
    while ((tMatch = clinicalTestRegex.exec(text)) !== null) {
      testBranchMatch = tMatch[1];
    }

    // Xóa mã [clinical-test:...] khỏi văn bản chính
    processed = processed.replace(/\[clinical-test:(asd|speech|adhd|sensory)\]/gi, '');

    // 1. Phát hiện các mã bài tập [ex-speech-01], [ex-asd-01], v.v.
    const exerciseRegex = /\[(ex-[a-z0-9-]+)\]/gi;
    const matchedExIds = [];
    let match;
    while ((match = exerciseRegex.exec(text)) !== null) {
      if (!matchedExIds.includes(match[1])) {
        matchedExIds.push(match[1]);
      }
    }

    // 2. Phát hiện các mã Tri thức động [kn-video:ID] và [kn-doc:ID]
    const knVideoRegex = /\[kn-video:([a-zA-Z0-9_-]+)\]/gi;
    const knDocRegex = /\[kn-doc:([a-zA-Z0-9_-]+)\]/gi;
    const matchedKnVideoIds = [];
    const matchedKnDocIds = [];
    let knMatch;

    while ((knMatch = knVideoRegex.exec(text)) !== null) {
      if (!matchedKnVideoIds.includes(knMatch[1])) matchedKnVideoIds.push(knMatch[1]);
    }
    while ((knMatch = knDocRegex.exec(text)) !== null) {
      if (!matchedKnDocIds.includes(knMatch[1])) matchedKnDocIds.push(knMatch[1]);
    }

    // Thay thế mã nhúng trong đoạn văn thành nút huy hiệu tương tác nhanh
    processed = processed
      .replace(/\[kn-video:([a-zA-Z0-9_-]+)\]/gi, (m, id) => {
        return `<span class="badge-kn-ref" onclick="window.openKnowledgeVideoPlayer('${id}')" title="Bấm để xem video">🎬 Xem Video Hướng Dẫn</span>`;
      })
      .replace(/\[kn-doc:([a-zA-Z0-9_-]+)\]/gi, (m, id) => {
        return `<span class="badge-kn-ref" onclick="window.downloadKnowledgeFile('${id}')" title="Bấm để tải tài liệu">📄 Tải Tài Liệu Hướng Dẫn</span>`;
      });

    // Markdown đơn giản: **in đậm**, *nghiêng*, danh sách
    processed = processed
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(ex-[a-z0-9-]+)\]/gi, '<span class="badge-exercise-ref">$1</span>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    processed = `<p>${processed}</p>`;

    // Render danh sách tệp đính kèm do AI gợi ý (nếu có)
    const dynamicList = typeof window.getStoredDynamicKnowledge === 'function' ? window.getStoredDynamicKnowledge() : [];
    if (matchedKnDocIds.length > 0) {
      const fileCards = matchedKnDocIds.map(id => {
        const item = dynamicList.find(k => k.id === id);
        if (!item || !item.file) return '';
        const f = item.file;
        let icon = '📄';
        if (f.name?.endsWith('.pdf')) icon = '📕';
        else if (f.name?.match(/\.(doc|docx)$/i)) icon = '📝';
        else if (f.name?.match(/\.(png|jpg|jpeg|webp)$/i)) icon = '🖼️';
        const title = f.description || f.name || 'Tài liệu hướng dẫn chuyên môn';
        const sizeText = f.size ? (window.formatFileSize ? window.formatFileSize(f.size) : `${(f.size / 1024).toFixed(0)} KB`) : 'Tài liệu trực tuyến';
        return `
          <div class="chat-embed-knowledge-file" onclick="window.downloadKnowledgeFile('${item.id}')">
            <div class="kn-file-thumb">
              <span class="kn-file-icon">${icon}</span>
            </div>
            <div class="kn-embed-details">
              <div class="kn-embed-badge file-badge">📄 TÀI LIỆU AI GỢI Ý CHO BẠN</div>
              <div class="kn-embed-title">${title}</div>
              <div class="kn-embed-meta">📦 ${sizeText} • Tác giả: ${item.author}</div>
              <div class="kn-embed-cta download-cta">📥 Bấm để tải / mở tài liệu ngay</div>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      if (fileCards) {
        processed += `<div class="chat-embedded-media-wrap"><div class="embed-title-label">📄 Tài liệu chuyên môn do AI gợi ý:</div>${fileCards}</div>`;
      }
    }

    // Render danh sách video hướng dẫn do AI gợi ý (nếu có)
    if (matchedKnVideoIds.length > 0) {
      const videoCards = matchedKnVideoIds.map(id => {
        const item = dynamicList.find(k => k.id === id);
        if (!item || !item.video) return '';
        const v = item.video;
        const ytId = v.youtubeId || (window.parseYouTubeId ? window.parseYouTubeId(v.url) : null);
        const thumb = ytId 
          ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
          : 'images/hero.png';
        const title = v.title || item.title;
        return `
          <div class="chat-embed-knowledge-video" onclick="window.openKnowledgeVideoPlayer('${item.id}')">
            <div class="kn-embed-thumb">
              <img src="${thumb}" alt="${title}">
              <span class="kn-embed-play">▶</span>
            </div>
            <div class="kn-embed-details">
              <div class="kn-embed-badge">🎬 VIDEO THỰC HÀNH AI GỢI Ý</div>
              <div class="kn-embed-title">${title}</div>
              <div class="kn-embed-meta">⏱️ ${v.duration || 'Video hướng dẫn'} • Chuyên gia: ${item.author}</div>
              <div class="kn-embed-cta">▶ Bấm để xem video thực hành ngay</div>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      if (videoCards) {
        processed += `<div class="chat-embedded-media-wrap"><div class="embed-title-label">🎬 Video hướng dẫn do AI gợi ý:</div>${videoCards}</div>`;
      }
    }

    // Render thẻ bài tập tương tác chuẩn hóa (nếu có)
    if (matchedExIds.length > 0 && typeof findExerciseById === 'function') {
      const cardsHtml = matchedExIds.map(id => {
        const ex = findExerciseById(id);
        if (!ex) return '';
        return `
          <div class="chat-embed-exercise-card" onclick="openExerciseDetail('${ex.id}')">
            <div class="embed-thumb">
              <img src="${ex.image}" alt="${ex.title}">
              <span class="embed-play-icon">▶</span>
            </div>
            <div class="embed-details">
              <div class="embed-title">${ex.title}</div>
              <div class="embed-meta">⏱️ ${ex.duration} • ${ex.centerName}</div>
              <div class="embed-action-cta">▶ Bấm để xem video &amp; bài tập này</div>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      if (cardsHtml) {
        processed += `<div class="chat-embedded-exercises-wrap"><div class="embed-title-label">🎯 Bài tập đề xuất cho bạn:</div>${cardsHtml}</div>`;
      }
    }

    // Render Thẻ Bài Test Sàng Lọc Chuẩn Y Khoa Tương Ứng (Bệnh gì thì cho bài test đó)
    if (testBranchMatch) {
      let testMeta = {
        title: 'Thang Sàng Lọc Phổ Tự Kỷ M-CHAT-R/F, CARS & DSM-5',
        standards: 'Chuẩn Bộ Y Tế & Quốc tế (16 - 36 tháng)',
        color: '#8b5cf6',
        icon: '🧩'
      };
      if (testBranchMatch === 'speech') {
        testMeta = {
          title: 'Thang Đánh Giá Mốc Phát Triển Ngôn Ngữ Denver II',
          standards: 'Mốc ngôn ngữ & vận động âm ngữ (18 - 36 tháng)',
          color: '#0284c7',
          icon: '🗣️'
        };
      } else if (testBranchMatch === 'adhd') {
        testMeta = {
          title: 'Thang Đánh Giá Hành Vi NICHQ Vanderbilt & DSM-5 ADHD',
          standards: 'Giảm chú ý, tăng động & kiểm soát xung động',
          color: '#ea580c',
          icon: '⚡'
        };
      } else if (testBranchMatch === 'sensory') {
        testMeta = {
          title: 'Hồ Sơ Điều Hòa Giác Quan Dunn Sensory Profile',
          standards: 'Xúc giác, thính giác, tiền đình & bản thể',
          color: '#059669',
          icon: '💆'
        };
      }

      processed += `
        <div class="chat-embed-test-card" onclick="window.openClinicalTestModal('${testBranchMatch}')" style="border-left-color: ${testMeta.color};">
          <div class="test-card-icon" style="background: ${testMeta.color}15; color: ${testMeta.color};">${testMeta.icon}</div>
          <div class="test-card-body">
            <div class="test-card-badge" style="color: ${testMeta.color}; background: ${testMeta.color}15;">📋 BÀI TEST CHUẨN Y KHOA ĐƯỢC CHỌN</div>
            <div class="test-card-title">${testMeta.title}</div>
            <div class="test-card-meta">${testMeta.standards}</div>
            <div class="test-card-hint">Sau khi làm xong, hệ thống gửi kết quả đồng thời đến các bác sĩ &amp; phòng khám để nhận phản hồi sớm nhất!</div>
          </div>
          <button type="button" class="test-card-btn" style="background: ${testMeta.color};">
            Làm Test Ngay ➔
          </button>
        </div>
      `;
    }

    // Luôn định dạng hoặc bổ sung dòng tuyên bố miễn trừ bắt buộc
    const disclaimerText = 'chat box Ai chỉ là công cụ hỗ trợ và có thể mắc sai sót';
    const hasDisclaimer = processed.toLowerCase().includes('chat box ai chỉ là công cụ hỗ trợ');
    if (!hasDisclaimer) {
      processed += `<div class="ai-mandatory-disclaimer-badge">⚠️ ${disclaimerText}</div>`;
    } else {
      // Bọc dòng chữ đã có vào badge đẹp
      processed = processed.replace(
        new RegExp(disclaimerText, 'gi'),
        `<span class="ai-mandatory-disclaimer-badge">⚠️ ${disclaimerText}</span>`
      );
    }

    return processed;
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('chatWidgetMessages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }
}

// Khởi tạo Chatbot UI
window.edutraceChatbot = new EduTraceChatbotUI();

// Hàm toàn cục để bất kỳ nút nào trên thanh công cụ / trang web đều có thể gọi mở Trợ lý AI
window.openEduTraceChat = function(promptText = '') {
  if (window.edutraceChatbot && typeof window.edutraceChatbot.toggleChat === 'function') {
    window.edutraceChatbot.toggleChat(true);
    if (promptText) {
      setTimeout(() => {
        const input = document.getElementById('chatWidgetInput');
        if (input) {
          input.value = promptText;
          input.dispatchEvent(new Event('input'));
          window.edutraceChatbot.handleUserSubmit();
        }
      }, 300);
    }
  } else {
    const trigger = document.getElementById('chatWidgetTrigger');
    if (trigger) trigger.click();
    if (promptText) {
      setTimeout(() => {
        const input = document.getElementById('chatWidgetInput');
        if (input) {
          input.value = promptText;
          input.dispatchEvent(new Event('input'));
          const form = document.getElementById('chatWidgetForm');
          form?.dispatchEvent(new Event('submit'));
        }
      }, 300);
    }
  }
};
