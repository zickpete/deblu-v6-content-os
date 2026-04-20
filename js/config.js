/* ================================================
   V.6 Content OS — Config
   Brand constants, product catalog, AI settings
   ================================================ */

window.V6_CONFIG = {

  /* ─── Brand ─── */
  brand: "Deblu Thailand",
  brandThai: "เดบลู ไทยแลนด์",
  tagline: "รองเท้าเพื่อสุขภาพ สวยครบ แข็งแรงทน",
  targetAudience: "ผู้หญิงไทย อายุ 25–45 ปี รักสุขภาพและสไตล์",

  /* ─── Content Pillars ─── */
  pillars: [
    { id: "lifestyle",  label: "สายลุย",         color: "#a68cff", emoji: "🏃‍♀️" },
    { id: "promo",      label: "สายโปรโมชั่น",   color: "#ff6c95", emoji: "🎉" },
    { id: "brand",      label: "Brand Love",      color: "#81ecff", emoji: "💙" },
    { id: "seasonal",   label: "Seasonal",        color: "#fbbf24", emoji: "🌸" },
    { id: "community",  label: "Community",       color: "#4ade80", emoji: "👥" },
  ],

  /* ─── Product Catalog ─── */
  products: [
    "L5623", "L5624", "L5625", "L5626",
    "L8000", "L8001", "L4706",
    "SL-01", "SL-02", "SL-03",
  ],

  /* ─── Month Options (Thai-aware) ─── */
  months: [
    "January 2026", "February 2026", "March 2026",
    "April 2026",   "May 2026",      "June 2026",
    "July 2026",    "August 2026",   "September 2026",
    "October 2026", "November 2026", "December 2026",
    "January 2027", "February 2027", "March 2027",
    "April 2027",
  ],

  /* ─── Kanban Statuses (Layer 1) ─── */
  kanbanStatuses: [
    { id: 'Idea',      label: '💡 Idea',       color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
    { id: 'Drafting',  label: '✏️ Drafting',   color: '#a68cff', bg: 'rgba(166,140,255,0.12)' },
    { id: 'Graphic',   label: '🎨 Graphic',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
    { id: 'Review',    label: '🔍 Review',     color: '#81ecff', bg: 'rgba(129,236,255,0.12)' },
    { id: 'Scheduled', label: '✅ Scheduled', color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  ],

  /* ─── Special Day Rules (Layer 1 Scheduler) ─── */
  specialDayRules: {
    lotteryDays:   [1, 16],
    paydayFrom:    25,
    lotteryTrack:  'Engagement / Fun 🔮',
    weekendLabel:  'Weekend Vibe 🌴',
    paydayLabel:   'Payday Sale 💰',
    lotteryLabel:  'Lottery Day 🔮',
  },

  /* ─── AI Provider ─── */
  // Options: "gemini" | "openai" | "mock"
  // "mock" will generate deterministic demo data without any API call.
  apiProvider: "gemini",
  geminiModel: "gemini-2.0-flash",
  openaiModel: "gpt-4o",

  /* ─── System Prompt Template ─── */
  buildSystemPrompt() {
    // Pull compact product knowledge base from localStorage
    const productRef = (typeof V6Store !== 'undefined') ? V6Store.getProductReference() : '';
    const productContext = productRef
      ? `\n\n【PRODUCT KNOWLEDGE BASE】\n${productRef}\n\nPRODUCT RULES:\n- Model names starting with "M" = Men's Shoes (รองเท้าผู้ชาย)\n- Model names starting with "L" = Women's Shoes (รองเท้าผู้หญิง)\n- Always use the EXACT prices provided in the Product Reference above. Do NOT hallucinate or invent prices.\n- Reference specific model names and prices when creating content strategies.`
      : '';

    return `You are the Senior Content Strategist AI for ${this.brand} (${this.brandThai}), a Thai footwear brand.
Brand positioning: ${this.tagline}
Primary target audience: ${this.targetAudience}
Content Pillars: ${this.pillars.map(p => p.label).join(", ")}${productContext}

Your role is to generate structured, creative, and commercially effective monthly content campaign strategies for social media (Facebook, Instagram, TikTok).

Output ONLY valid JSON matching this exact schema — NO MARKDOWN, NO EXPLANATIONS:
{
  "monthly_theme": "string (creative campaign name, 2-5 words, impactful, can mix English/Thai)",
  "mood_and_tone": {
    "palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"],
    "font_vibe": "string (typography style description IN THAI)",
    "visual_direction": "string (1-2 sentences describing visual style IN THAI)"
  },
  "campaign_tracks": [
    {
      "track_name": "string (Thai or English, creative and memorable)",
      "objective": "string (exactly 2 sentences IN THAI: what the track achieves and why)",
      "content_ratio": number (integer, percentage of total posts),
      "key_selling_point": "string (1 sentence IN THAI, product-benefit focused)"
    }
  ]
}

STRICT RULES:
1. campaign_tracks must contain EXACTLY 3 objects.
2. The sum of all content_ratio values MUST equal exactly 100.
3. palette must contain exactly 4 hex color codes appropriate for a Thai women's lifestyle brand.
4. All content must reflect Thai cultural context and festivals mentioned in events.
5. Track names should be memorable, mixing Thai and English naturally if appropriate.
6. ALL descriptions (font_vibe, visual_direction, objective, key_selling_point) MUST BE IN THAI LANGUAGE.
7. Return ONLY the JSON object, nothing else. START WITH { AND END WITH }. DO NOT USE MARKDOWN BACKTICKS.`;
  },

  buildUserPrompt(month, products, events) {
    return `Generate a complete monthly content strategy for:
Month: ${month}
Core Products to Feature: ${products.join(", ")}
Special Events / Promotions: ${events || "No special events"}

Create 3 campaign tracks that complement each other, covering different customer segments or content types. Ensure the strategy feels cohesive under a single monthly theme.`;
  },

  /* ─── Layer 1: Batch Topic Prompt Builder ─── */
  buildTopicsSystemPrompt() {
    return `You are a bilingual social media content writer for ${this.brand} (${this.brandThai}).
Brand: ${this.tagline} | Audience: ${this.targetAudience}

Generate a SHORT, creative, engaging 1-sentence suggested topic in BOTH THAI AND ENGLISH for each ContentCard.
- Topics must feel natural and appealing to the target audience
- Reference the track theme and any special tag context
- Keep each topic under 120 characters per language
- Return ONLY a JSON array, no explanation:
[{"id": "card_xxx", "topic_th": "...", "topic_en": "..."}]
STRICT: NO MARKDOWN BACKTICKS. START WITH [ AND END WITH ].`;
  },

  buildTopicsUserPrompt(cards, strategy) {
    const cardList = cards.map(c => ({
      id: c.id,
      date: c.date,
      day_of_week: c.day_of_week,
      track: c.track_name,
      special_tag: c.special_tag || null,
    }));
    return `Strategy Theme: "${strategy.monthly_theme}"
Products: ${(strategy.core_products || []).join(', ')}
Events: ${strategy.special_events || 'ไม่มี'}

Generate topics for these ${cards.length} ContentCards:
${JSON.stringify(cardList, null, 2)}`;
  },

  /* ─── Mock Strategy Response (no API key / Demo Mode) ─── */
  getMockResponse(month, products, lang) {
    lang = lang || (typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th');
    const monthName = (month || '').split(' ')[0] || 'Unknown';
    
    // Base Themes
    const themes = {
      January:   'New Year New Sole 🎆',
      February:  'Walk Into Love 💕',
      March:     'Spring Forward Step 🌸',
      April:     'Songkran Splash Walk 💦',
      May:       'Summer Stride Festival ☀️',
      June:      'Monsoon Comfort Style 🌧️',
      July:      'Mid-Year Power Step 💪',
      August:    'Queen of Comfort 👑',
      September: 'Back to Stride 📚',
      October:   'Autumn Glow Walk 🍂',
      November:  'Loy Krathong Light Step 🏮',
      December:  'Holiday Sole Celebration 🎄',
    };
    
    const palettes = {
      January:   ['#a68cff', '#ff6c95', '#81ecff', '#fbbf24'],
      February:  ['#ff6b81', '#ffa3b5', '#c4b5fd', '#fcd34d'],
      March:     ['#f9a8d4', '#a78bfa', '#67e8f9', '#fde68a'],
      April:     ['#38bdf8', '#22d3ee', '#a78bfa', '#fbbf24'],
      May:       ['#fbbf24', '#f59e0b', '#ff6c95', '#4ade80'],
      June:      ['#64748b', '#81ecff', '#a68cff', '#94a3b8'],
      July:      ['#a68cff', '#4ade80', '#ff6c95', '#fbbf24'],
      August:    ['#c084fc', '#f472b6', '#fbbf24', '#4ade80'],
      September: ['#60a5fa', '#a78bfa', '#fbbf24', '#4ade80'],
      October:   ['#f97316', '#fbbf24', '#a68cff', '#4ade80'],
      November:  ['#fbbf24', '#f59e0b', '#ff6c95', '#81ecff'],
      December:  ['#ef4444', '#22c55e', '#fbbf24', '#81ecff'],
    };

    const productStr = (products || []).slice(0, 3).join(', ') || 'Deblu Collection';
    
    // Translation logic
    const fontVibe = lang === 'en' 
      ? 'Modern Rounded Sans-Serif — Fun, approachable, yet premium'
      : 'Modern Rounded Sans-Serif — สนุก เป็นกันเอง แต่ยังดูพรีเมียม';
      
    const visualDir = lang === 'en'
      ? `Bright, vibrant Lifestyle visual direction. Flat lay + On-feet shots for ${productStr}. Use warm filter focusing on natural light and soft shadow.`
      : `ภาพ Lifestyle สว่าง สดใส แนว Flat lay + On-feet shots สำหรับ ${productStr} ใช้โทน warm filter เน้น natural light กับ soft shadow`;

    const track1Name = lang === 'en' ? `Active ${monthName} Edition 🏃‍♀️` : `สายลุย ${monthName} Edition 🏃‍♀️`;
    const track1Obj = lang === 'en'
      ? `Communicate the active lifestyle of ${monthName} through Deblu shoes, making customers feel an elevated lifestyle. Highlight comfort technology.`
      : `สื่อสาร Lifestyle active ของ ${monthName} ผ่านรองเท้า Deblu ให้ลูกค้ารู้สึกว่าใส่แล้ว Lifestyle ดีขึ้น พร้อมเน้น Comfort technology`;
    const track1Ksp = lang === 'en'
      ? `Deblu ${productStr} — Health-focused footwear providing comfort and confidence in every step.`
      : `Deblu ${productStr} — รองเท้าเพื่อสุขภาพที่ทำให้ทุกก้าวของคุณสบายและมั่นใจ`;

    const track2Name = 'Flash Sale Fever 🔥';
    const track2Obj = lang === 'en'
      ? `Drive sales with a time-limited Flash Sale promotion to create urgency. Utilize Social proof from real reviews to increase conversion.`
      : `กระตุ้นยอดขายด้วยโปรโมชั่น time-limited แบบ Flash Sale ที่สร้าง urgency ใช้ Social proof จากรีวิวจริงเพื่อเพิ่ม conversion`;
    const track2Ksp = lang === 'en'
      ? `Up to 40% off this week only! ${productStr} at special prices with free shipping nationwide.`
      : `ลดสูงสุด 40% เฉพาะสัปดาห์นี้! ${productStr} ราคาพิเศษ พร้อมส่งฟรีทั่วไทย`;

    const track3Name = 'Brand Love Stories 💙';
    const track3Obj = lang === 'en'
      ? `Build brand affinity through Behind-the-scenes, Customer stories, and Quality manufacturing processes to foster long-term trust and loyalty.`
      : `สร้าง Brand affinity ผ่าน Behind-the-scenes, Customer stories, และ Quality process เพื่อเพิ่ม trust และ loyalty ระยะยาว`;
    const track3Ksp = lang === 'en'
      ? `Every pair endures a 5-step quality test — Deblu cares about every detail for your feet.`
      : `ทุกคู่ผ่านการทดสอบ 5 ขั้นตอน — Deblu ใส่ใจทุกรายละเอียดเพื่อเท้าของคุณ`;

    return {
      is_mock: true,
      original_input: { month, products },
      monthly_theme: themes[monthName] || `${monthName} Power Walk 🚀`,
      mood_and_tone: {
        palette: palettes[monthName] || ['#a68cff', '#ff6c95', '#81ecff', '#fbbf24'],
        font_vibe: fontVibe,
        visual_direction: visualDir,
      },
      campaign_tracks: [
        { track_name: track1Name, objective: track1Obj, content_ratio: 40, key_selling_point: track1Ksp },
        { track_name: track2Name, objective: track2Obj, content_ratio: 35, key_selling_point: track2Ksp },
        { track_name: track3Name, objective: track3Obj, content_ratio: 25, key_selling_point: track3Ksp },
      ],
    };
  },

  /* ─── Mock Topics (no API key) ─── */
  getMockTopics(cards, strategy) {
    const promoEn = [
      `🔥 Hot Deal! ${strategy.monthly_theme} Summer Special. Don't miss out!`,
      `💸 Shop Now! Flash Sale special today only with Deblu.`,
      `🎁 Best value ever! Nab your favorites at special prices.`,
    ];
    const promoTh = [
      `🔥 โปรสุดปัง! ${strategy.monthly_theme} ลดพิเศษรับซัมเมอร์ อย่ามิสส์!`,
      `💸 ช้อปเลย! Flash Sale พิเศษวันนี้ มีแต่ได้กับ Deblu`,
      `🎁 ไม่ซื้อตอนนี้ รู้สึกผิดแน่ โปรสุดคุ้มรอคุณอยู่`,
    ];

    const lifeEn = [
      `☀️ Walk into the light with Deblu. Healthy feet for a confident you.`,
      `🌺 Where to this morning? Deblu is ready to go anywhere with you.`,
      `💪 Step forward this summer with shoes that feel like real comfort.`,
    ];
    const lifeTh = [
      `☀️ ใส่ Deblu ออกไปเจอแสงแดด เพราะรองเท้าดีทำให้ทุกก้าวมั่นใจ`,
      `🌺 สายลุยเช้านี้ไปไหน? Deblu พร้อมไปทุกที่กับคุณ`,
      `💪 ฤดูร้อนนี้ ก้าวไปข้างหน้าด้วยรองเท้าที่ใส่แล้วสบายจริง`,
    ];

    const brandEn = [
      `💙 Behind the Scenes — Every pair meets our health standards.`,
      `⭐ Customers say... "It feels like walking on clouds."`,
      `🏠 Brand Story: From our heart, to your feet.`,
    ];
    const brandTh = [
      `💙 เบื้องหลัง Deblu — ทุกคู่ผ่านมาตรฐานคุณภาพเพื่อสุขภาพเท้าของคุณ`,
      `⭐ ลูกค้า Deblu บอกว่า... ใส่แล้วเหมือนเดินบนเมฆ`,
      `🏠 Brand Story: จากใจผู้ผลิต ถึงเท้าของคุณ`,
    ];

    const lottoEn = [
      `🔮 Lottery Day! Which shoe style best predicts your luck today?`,
      `🎯 Guess and Win! Which Deblu fits your vibe this weekend?`,
    ];
    const lottoTh = [
      `🔮 วันนี้หวยออก! บอกหน่อยว่าสไตล์รองเท้าไหนที่บอกดวงคุณดีที่สุด?`,
      `🎯 ทายถูกได้รางวัล! Deblu รุ่นไหนที่เหมาะกับ Vibe คุณวันนี้?`,
    ];

    const paydayEn = [
      `💰 Payday! Treat your feet to a new pair of Deblu comforts.`,
      `🛒 Paycheck = Self-care Day! Time to upgrade your footwear.`,
    ];
    const paydayTh = [
      `💰 เงินเดือนออกแล้ว! เติมความสุขให้เท้าด้วย Deblu ลดพิเศษรับเดือนใหม่`,
      `🛒 Paycheck = Self-care Day! ถึงเวลาอัปเกรดรองเท้าสักที`,
    ];

    const weekendEn = [
      `🌴 Weekend Vibes. Step out and breathe the holiday air with Deblu.`,
      `🌞 Long weekend coming? Don't forget your comfortable Deblu.`,
    ];
    const weekendTh = [
      `🌴 Weekend Vibe ชิลๆ ใส่ Deblu ออกไปสูดลมหายใจวันหยุด`,
      `🌞 หยุดยาวนี้ไปไหน? รองเท้าดีต้องมา Deblu ก่อนเลย`,
    ];

    return cards.map(c => {
      let poolEn, poolTh;
      if (c.special_tag && (c.special_tag.includes('Lottery') || c.special_tag.includes('หวย'))) { poolEn = lottoEn; poolTh = lottoTh; }
      else if (c.special_tag && (c.special_tag.includes('Payday') || c.special_tag.includes('เงินเดือน'))) { poolEn = paydayEn; poolTh = paydayTh; }
      else if (c.special_tag && (c.special_tag.includes('Weekend') || c.special_tag.includes('วันหยุด'))) { poolEn = weekendEn; poolTh = weekendTh; }
      else if (c.track_name && c.track_name.match(/โปร|promo|sale/i)) { poolEn = promoEn; poolTh = promoTh; }
      else if (c.track_name && c.track_name.match(/brand|love|trust/i)) { poolEn = brandEn; poolTh = brandTh; }
      else { poolEn = lifeEn; poolTh = lifeTh; }

      const idx = Math.floor(Math.random() * poolEn.length);
      return { id: c.id, topic_th: poolTh[idx], topic_en: poolEn[idx] };
    });
  },
};
