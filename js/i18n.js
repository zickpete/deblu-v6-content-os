/* ================================================
   V.6 Content OS — i18n (Localization Engine)
   Lightweight TH / EN language toggle system
   ================================================ */

window.V6i18n = (function () {

  const STORAGE_KEY = 'v6_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'th';

  /* ─── Translation Dictionary ─── */
  const dict = {

    /* ═══ GLOBAL / HEADER ═══ */
    'header.settings':          { th: '⚙️ ตั้งค่า (Settings)',   en: '⚙️ Settings' },
    'header.layer0':            { th: '🧠 Layer 0',              en: '🧠 Layer 0' },
    'header.layer1':            { th: '📅 Layer 1',              en: '📅 Layer 1' },
    'header.layer2':            { th: '🃏 Layer 2',              en: '🃏 Layer 2' },
    'header.crumb.brain':       { th: 'Layer 0: Brain',          en: 'Layer 0: Brain' },
    'header.crumb.calendar':    { th: 'Layer 1: Calendar',       en: 'Layer 1: Calendar' },
    'header.crumb.factory':     { th: 'Layer 2: Factory',        en: 'Layer 2: Factory' },
    'header.back':              { th: '🔙 กลับ',                en: '🔙 Back' },
    'header.signin':            { th: '🔑 เข้าสู่ระบบ',          en: '🔑 Sign In' },
    'header.signout':           { th: 'ออกจากระบบ',              en: 'Sign Out' },

    /* ═══ COMMON UI ═══ */
    'common.save':              { th: '💾 บันทึก',               en: '💾 Save' },
    'common.delete':            { th: '🗑️ ลบ',                  en: '🗑️ Delete' },
    'common.cancel':            { th: 'ยกเลิก',                  en: 'Cancel' },
    'common.confirm':           { th: 'ยืนยัน',                  en: 'Confirm' },
    'common.loading':           { th: 'กำลังโหลด...',           en: 'Loading...' },
    'common.saved':             { th: '✅ บันทึกแล้ว!',           en: '✅ Saved!' },

    /* ═══ MONTHS ═══ */
    'month.jan':                { th: 'มกราคม',                 en: 'January' },
    'month.feb':                { th: 'กุมภาพันธ์',             en: 'February' },
    'month.mar':                { th: 'มีนาคม',                  en: 'March' },
    'month.apr':                { th: 'เมษายน',                 en: 'April' },
    'month.may':                { th: 'พฤษภาคม',               en: 'May' },
    'month.jun':                { th: 'มิถุนายน',                en: 'June' },
    'month.jul':                { th: 'กรกฎาคม',               en: 'July' },
    'month.aug':                { th: 'สิงหาคม',                en: 'August' },
    'month.sep':                { th: 'กันยายน',                en: 'September' },
    'month.oct':                { th: 'ตุลาคม',                 en: 'October' },
    'month.nov':                { th: 'พฤศจิกายน',             en: 'November' },
    'month.dec':                { th: 'ธันวาคม',                en: 'December' },

    /* ═══ DAYS ═══ */
    'day.sun':                  { th: 'อาทิตย์',                en: 'Sunday' },
    'day.mon':                  { th: 'จันทร์',                 en: 'Monday' },
    'day.tue':                  { th: 'อังคาร',                 en: 'Tuesday' },
    'day.wed':                  { th: 'พุธ',                    en: 'Wednesday' },
    'day.thu':                  { th: 'พฤหัสบดี',               en: 'Thursday' },
    'day.fri':                  { th: 'ศุกร์',                  en: 'Friday' },
    'day.sat':                  { th: 'เสาร์',                  en: 'Saturday' },
    'day.sunday':               { th: 'อาทิตย์',                en: 'Sunday' },
    'day.monday':               { th: 'จันทร์',                 en: 'Monday' },
    'day.tuesday':              { th: 'อังคาร',                 en: 'Tuesday' },
    'day.wednesday':            { th: 'พุธ',                    en: 'Wednesday' },
    'day.thursday':             { th: 'พฤหัสบดี',               en: 'Thursday' },
    'day.friday':               { th: 'ศุกร์',                  en: 'Friday' },
    'day.saturday':             { th: 'เสาร์',                  en: 'Saturday' },

    /* ═══ KANBAN / STATUS ═══ */
    'status.idea':              { th: '💡 ไอเดีย',               en: '💡 Idea' },
    'status.drafting':          { th: '✏️ กำลังเขียน',           en: '✏️ Drafting' },
    'status.graphic':           { th: '🎨 ออกแบบ',               en: '🎨 Graphic' },
    'status.review':            { th: '🔍 ตรวจสอบ',              en: '🔍 Review' },
    'status.scheduled':         { th: '✅ ตั้งเวลาโพสต์',        en: '✅ Scheduled' },

    /* ═══ CARD TAGS ═══ */
    'tag.lottery':              { th: '🔮 วันหวยออก',           en: '🔮 Lottery Day' },
    'tag.payday':               { th: '💰 วันเงินเดือนออก',      en: '💰 Payday Sale' },
    'tag.weekend':              { th: '🌴 วันหยุดสุดสัปดาห์',    en: '🌴 Weekend Vibe' },

    /* ═══ INDEX / HUB ═══ */
    'hub.subtitle':             { th: 'AI-Driven Content Management System · Deblu Thailand 🇹🇭',
                                  en: 'AI-Driven Content Management System · Deblu Thailand 🇹🇭' },
    'hub.layer0.name':          { th: 'สมองกล AI',               en: 'The Brain' },
    'hub.layer0.desc':          { th: 'AI Monthly Strategy Generator — กำหนด parameter แล้วให้ AI สร้าง 3-track campaign strategy พร้อม Mood & Tone',
                                  en: 'AI Monthly Strategy Generator — Set parameters and let AI create a 3-track campaign strategy with Mood & Tone' },
    'hub.layer1.name':          { th: 'ปฏิทิน',                  en: 'The Calendar' },
    'hub.layer1.desc':          { th: 'AI Content Calendar — รับ strategy จาก Layer 0 แล้วสร้าง 30-day post schedule พร้อม Drag & Drop',
                                  en: 'AI Content Calendar — Receive strategy from Layer 0, generate a 30-day post schedule with Drag & Drop' },
    'hub.layer2.name':          { th: 'โรงงานโพสต์',            en: 'Post Factory' },
    'hub.layer2.desc':          { th: 'AI Post Editor — ลงลึกในแต่ละ Content Card เขียนแคปชั่น & พาดหัวด้วย AI Tools Drawer',
                                  en: 'AI Post Editor — Deep-dive into each Content Card, write captions & headlines with AI Tools Drawer' },
    'hub.layer3.name':          { th: 'วิเคราะห์ผล',             en: 'Analytics' },
    'hub.layer3.desc':          { th: 'Performance Dashboard — Track engagement, วัดผล KPI และให้ AI วิเคราะห์ผลงานประจำเดือน',
                                  en: 'Performance Dashboard — Track engagement, measure KPIs and let AI analyze monthly performance' },
    'hub.badge.ready':          { th: '✅ พร้อมใช้งาน',          en: '✅ Ready' },
    'hub.badge.coming':         { th: '🔒 เร็วๆ นี้',           en: '🔒 Coming Soon' },
    'hub.footer':               { th: 'V.6 Content OS · Deblu Thailand · สร้างด้วย ✨ AI',
                                  en: 'V.6 Content OS · Deblu Thailand · Built with ✨ AI' },

    /* ═══ LAYER 0 — THE BRAIN ═══ */
    'l0.title':                 { th: 'Monthly Strategy Generator',
                                  en: 'Monthly Strategy Generator' },
    'l0.subtitle':              { th: 'กำหนด parameters → AI สร้าง 3-track campaign strategy พร้อม Mood & Tone สำหรับเดือนนั้น',
                                  en: 'Set parameters → AI generates a 3-track campaign strategy with Mood & Tone for that month' },
    'l0.setup.title':           { th: '⚙️ ตั้งค่าเดือนใหม่',    en: '⚙️ New Month Setup' },
    'l0.month.label':           { th: '📅 เดือนและปี',           en: '📅 Month & Year' },
    'l0.products.label':        { th: '👟 สินค้าหลัก',           en: '👟 Core Products' },
    'l0.products.placeholder':  { th: 'พิมพ์รหัสสินค้า + Enter…',  en: 'Type product code + Enter…' },
    'l0.products.hint':         { th: 'พิมพ์รหัสสินค้า แล้วกด Enter หรือเลือกจาก dropdown',
                                  en: 'Type a product code and press Enter, or select from dropdown' },
    'l0.events.label':          { th: '🎉 โปรโมชั่น / กิจกรรมพิเศษ',
                                  en: '🎉 Special Events / Promotions' },
    'l0.events.placeholder':    { th: 'เช่น Songkran Festival, 4.4 Sale 30%, Mother\'s Day Campaign...',
                                  en: 'e.g. Songkran Festival, 4.4 Sale 30%, Mother\'s Day Campaign...' },
    'l0.generate':              { th: '✨ สร้างกลยุทธ์ประจำเดือน',
                                  en: '✨ Generate Monthly Strategy' },
    'l0.history':               { th: '📂 กลยุทธ์ล่าสุด',       en: '📂 Recent Strategies' },
    'l0.history.empty':         { th: 'ยังไม่มีกลยุทธ์',         en: 'No strategies yet.' },

    /* Output */
    'l0.theme.label':           { th: '✨ ธีมประจำเดือน',        en: '✨ Monthly Theme' },
    'l0.palette.label':         { th: '🎨 เฉดสีประจำเดือน',      en: '🎨 Color Palette' },
    'l0.font.label':            { th: '🖋 ฟอนต์ & อารมณ์ภาพ',   en: '🖋 Font & Visual Vibe' },
    'l0.visual.label':          { th: '🌅 ทิศทางภาพ',           en: '🌅 Visual Direction' },
    'l0.tracks.title':          { th: '📋 แคมเปญแทร็ค',         en: '📋 Campaign Tracks' },
    'l0.tracks.add':            { th: '＋ เพิ่มแคมเปญใหม่',      en: '＋ Add Custom Campaign' },
    'l0.tracks.objective':      { th: '🎯 วัตถุประสงค์',         en: '🎯 Objective' },
    'l0.tracks.ksp':            { th: '💡 จุดขายหลัก',           en: '💡 Key Selling Point' },
    'l0.tracks.percent':        { th: '% ของโพสต์',             en: '% of posts' },
    'l0.ratio.warning':         { th: '⚠️ สัดส่วนรวม:',         en: '⚠️ Ratio total:' },
    'l0.ratio.must100':         { th: '(ต้องเท่ากับ 100%)',      en: '(must be 100%)' },

    /* Approve */
    'l0.approve.question':      { th: 'พร้อมล็อกกลยุทธ์นี้?',    en: 'Ready to lock this strategy?' },
    'l0.approve.desc':          { th: 'แทร็คทั้งหมดจะถูกบันทึกและส่งไปยัง Content Calendar',
                                  en: 'All tracks will be saved and sent to the Content Calendar.' },
    'l0.approve.btn':           { th: '✅ อนุมัติ & ส่งไปปฏิทิน',
                                  en: '✅ Approve & Send to Calendar' },
    'l0.approved.title':        { th: 'อนุมัติกลยุทธ์แล้ว!',     en: 'Strategy Approved!' },
    'l0.approved.sub':          { th: 'บันทึกเรียบร้อย พร้อมไป Layer 1: สร้างปฏิทิน',
                                  en: 'Saved and ready for Layer 1: Calendar Generation' },

    /* Empty state */
    'l0.empty.title':           { th: 'รอ Parameters ของคุณ',    en: 'Waiting for Your Parameters' },
    'l0.empty.desc':            { th: 'เลือกเดือน, เพิ่มสินค้า และระบุ Events แล้วกด',
                                  en: 'Select a month, add products, specify Events, then click' },
    'l0.empty.desc2':           { th: 'AI จะสร้าง 3-track campaign strategy ให้ทันที',
                                  en: 'AI will generate a 3-track campaign strategy instantly' },

    /* ═══ LAYER 1 — CALENDAR ═══ */
    'l1.title':                 { th: 'Calendar Engine',          en: 'Calendar Engine' },
    'l1.subtitle':              { th: 'Algorithm แจก ContentCard → AI สร้าง Topic → Drag & Drop จัดตาราง',
                                  en: 'Algorithm distributes ContentCards → AI generates Topics → Drag & Drop scheduling' },
    'l1.locked.text':           { th: 'Calendar ถูก Lock แล้ว — พร้อม Execution!',
                                  en: 'Calendar is Locked — Ready for Execution!' },
    'l1.locked.sub':            { th: 'ใช้ Kanban Board เพื่อ Track สถานะของแต่ละโพสต์',
                                  en: 'Use Kanban Board to track the status of each post' },
    'l1.locked.newstrategy':    { th: '+ Strategy ใหม่',         en: '+ New Strategy' },
    'l1.loading':               { th: '⏳ กำลังโหลด Strategy...',
                                  en: '⏳ Loading Strategy...' },
    'l1.action.hint':           { th: 'กด ✨ สร้าง Schedule เพื่อเริ่มต้น',
                                  en: 'Click ✨ Generate Schedule to start' },

    /* Modal */
    'modal.ai.title':           { th: '⚙️ ตั้งค่า AI',          en: '⚙️ AI Settings' },
    'modal.ai.provider':        { th: 'ผู้ให้บริการ AI',         en: 'AI Provider' },
    'modal.ai.key':             { th: 'API Key',                 en: 'API Key' },
    'modal.ai.key.placeholder': { th: 'วาง API Key ที่นี่...',   en: 'Paste your API key here...' },
    'modal.ai.key.hint':        { th: '🔒 เก็บใน Browser — ไม่ส่งไปไหนนอกจาก AI API',
                                  en: '🔒 Stored locally in your browser — never sent anywhere except the AI API.' },
    'modal.ai.key.noapihint':   { th: 'ไม่มี API Key? แอปจะใช้ Demo Mode แทน',
                                  en: 'No API Key? The app will use Demo Mode instead.' },
    /* AI Settings Modal Mapping */
    'modal.ai.layer0':          { th: '🧠 Layer 0: The Brain (Strategy)', en: '🧠 Layer 0: The Brain (Strategy)' },
    'modal.ai.layer1':          { th: '📅 Layer 1: The Engine (Calendar)', en: '📅 Layer 1: The Engine (Calendar)' },
    'modal.ai.layer2':          { th: '🏭 Layer 2: The Factory (Editor Tools)', en: '🏭 Layer 2: The Factory (Editor Tools)' },
    'modal.ai.test':            { th: '🔌 ทดสอบการเชื่อมต่อ API', en: '🔌 Test API Connection & Model' },
    'modal.ai.save':            { th: '💾 บันทึก Key',           en: '💾 Save Key' },
    'modal.ai.clear':           { th: '🗑 ลบ',                  en: '🗑 Clear' },

    /* AI Settings Modal (Models) */
    'modal.ai.engine.title':    { th: 'Gemini AI Engine',        en: 'Gemini AI Engine' },
    'modal.ai.cat.ultra':       { th: '🟢 Ultra-Light & Speed <span class="model-cat-sub">(งานเบา เน้นความเร็วและประหยัดสุด)</span>',
                                  en: '🟢 Ultra-Light & Speed <span class="model-cat-sub">(Fast & Cost-effective)</span>' },
    'modal.ai.cat.standard':    { th: '🟡 Standard & Balanced <span class="model-cat-sub">(งานเขียนทั่วไป คุ้มค่าและฉลาด)</span>',
                                  en: '🟡 Standard & Balanced <span class="model-cat-sub">(General writing, smart & balanced)</span>' },
    'modal.ai.cat.advanced':    { th: '🔴 Advanced Reasoning <span class="model-cat-sub">(งาน Mastermind คิดกลยุทธ์ลึกซึ้ง)</span>',
                                  en: '🔴 Advanced Reasoning <span class="model-cat-sub">(Complex Mastermind Strategy)</span>' },
    'modal.ai.cat.audio':       { th: '🎧 Voice & Audio <span class="model-cat-sub">(ระบบเสียงและบทสนทนา)</span>',
                                  en: '🎧 Voice & Audio <span class="model-cat-sub">(Voice & Audio systems)</span>' },
    
    'modal.ai.desc.flite25':    { th: '~$0.10/1M tokens | จุดเด่น: ใช้งานพื้นฐาน, แปลสั้นๆ',
                                  en: '~$0.10/1M tokens | Best for: Basic tags, short translations' },
    'modal.ai.desc.flite31':    { th: '~$0.25/1M tokens | จุดเด่น: งานปริมาณมากความเร็วสูง, ฟอร์แมต JSON',
                                  en: '~$0.25/1M tokens | Best for: High-volume rapid tasks, JSON formatting' },
    'modal.ai.desc.f25':        { th: '~$0.30/1M tokens | จุดเด่น: แคปชั่นทั่วไป, เครื่องมือมาตรฐานของ Drawer',
                                  en: '~$0.30/1M tokens | Best for: Everyday captions, standard Drawer tools' },
    'modal.ai.desc.f30':        { th: '~$0.50/1M tokens | จุดเด่น: ความเร็วระดับสูงสุด, เครื่องมือที่ซับซ้อนใน Editor',
                                  en: '~$0.50/1M tokens | Best for: Frontier-class speed, complex Editor tools' },
    'modal.ai.desc.p25':        { th: '~$1.25/1M tokens | จุดเด่น: การวางแผนแคมเปญมารตฐาน',
                                  en: '~$1.25/1M tokens | Best for: Standard campaign planning' },
    'modal.ai.desc.p31':        { th: '~$2.00/1M tokens | จุดเด่น: ชั้นเชิงระดับสูงที่ Layer 0 & Agentic logic',
                                  en: '~$2.00/1M tokens | Best for: Layer 0 Master Strategy & Agentic logic' },
    'modal.ai.desc.t31f':       { th: 'ส่งออกเสียงความหน่วงต่ำ (Low latency Voice)',
                                  en: 'Low latency Voice generation' },
    'modal.ai.desc.t25p':       { th: 'สร้างเสียงคุณภาพสูงสมจริง (High-fidelity)',
                                  en: 'High-fidelity voice generation' },
    'modal.ai.desc.fad':        { th: 'ระบบเสียงและการโต้ตอบแบบ Real-time',
                                  en: 'Native audio understanding and generation' },

    'modal.ai.deep.title':      { th: '🧠 Deep Thinking Mode',   en: '🧠 Deep Thinking Mode' },
    'modal.ai.deep.desc':       { th: 'ใช้ระบบ Chain-of-Thought สำหรับคิดกลยุทธ์ที่ซับซ้อน (ใช้เวลาสร้างนานขึ้น)',
                                  en: 'Uses Chain-of-Thought for complex strategies (increases generation time).' },

    /* ═══ LAYER 0 — BRAIN (Extra) ═══ */
    'l0.year.label':            { th: 'ปี',                     en: 'Year' },
    'l0.history.title':         { th: '📂 ประวัติการสร้าง',       en: '📂 Strategy History' },
    'l0.btn.approve':           { th: '✅ อนุมัติกลยุทธ์',        en: '✅ Approve Strategy' },

    /* ═══ LAYER 1 — CALENDAR (Extra) ═══ */
    'l1.header.calendar':       { th: 'ปฏิทิน',                  en: 'Calendar' },
    'l1.header.kanban':         { th: 'Kanban',                en: 'Kanban' },
    'l1.empty.state':           { th: 'ยังไม่มีแผนงาน',         en: 'No content planned.' },
    'l1.empty.title':           { th: 'พร้อม Generate Schedule', en: 'Ready to Generate Schedule' },
    'l1.empty.desc':            { th: 'กด ✨ สร้าง Schedule ด้านบนเพื่อเริ่มสร้าง {month} Calendar',
                                  en: 'Click ✨ Generate Schedule above to start creating {month} Calendar' },
    'l1.btn.generate':          { th: '✨ สร้าง Schedule',      en: '✨ Generate Schedule' },
    'l1.btn.lock':              { th: '🔒 ล็อกปฏิทิน',           en: '🔒 Lock Calendar' },
    'l1.btn.back':              { th: '🔙 กลับสู่ Layer 0',     en: '🔙 Back to Layer 0' },
    'l1.btn.factory.send':      { th: '🚀 ส่งเข้าโรงงานโพสต์',   en: '🚀 Send to Post Factory' },

    /* ═══ LAYER 1 — MODAL ═══ */
    'l1.modal.status':          { th: '📊 สถานะ',                en: '📊 Status' },
    'l1.modal.edit':            { th: '🃏 แก้ไข',                en: '🃏 Edit' },

    /* ═══ LAYER 2 — FACTORY (Extra) ═══ */
    'l2.btn.save':              { th: '💾 บันทึก',               en: '💾 Save' },
    'l2.btn.delete':            { th: '🗑️ ลบการ์ด',              en: '🗑️ Delete' },
    'l2.btn.delete.title':      { th: 'ลบ Content Card นี้',      en: 'Delete this card' },
    'l2.btn.back':              { th: '🔙 กลับไป Calendar',     en: '🔙 Back to Calendar' },
    'l2.status.placeholder':    { th: 'เลือกสถานะ...',          en: 'Select status...' },
    'l2.error.params':          { th: '⚠️ ไม่พบข้อมูล Content Card (Missing Params)', en: '⚠️ Missing Content Card params' },
    'l2.error.strat':           { th: '⚠️ ไม่พบ Strategy ในระบบ', en: '⚠️ Strategy not found in system' },
    'l2.error.card':            { th: '⚠️ ไม่พบการ์ดที่เลือก',      en: '⚠️ Selected card not found' },
    'l2.refurl.label':          { th: '🔗 ลิงก์อ้างอิง (Pinterest/Web)', en: '🔗 Reference URL' },
    'l2.refurl.placeholder':    { th: 'https://pinterest.com/pin/...', en: 'https://pinterest.com/pin/...' },
    'l2.demo.mode':             { th: '🔵 โหลดโหมดสาธิต (ใช้ Card แรกล่าสุด)', en: '🔵 Demo Mode: Loading latest fallback card' },
    'l2.magic.tooShort':        { th: '⚠️ กรุณาเขียนเนื้อหาให้ยาวกว่านี้ก่อนทำการวิเคราะห์', en: '⚠️ Please write more content before analysis' },
    'l2.editor.date':           { th: 'วันที่ลง:',                en: 'Scheduled:' },
    'l2.editor.headline':       { th: 'Headline / Hook',        en: 'Headline / Hook' },
    'l2.editor.headline.ph':    { th: '💡 ใส่พาดหัว (Headline) ที่นี่...', en: '💡 Put your headline here...' },
    'l2.editor.caption':        { th: 'Captions / Content',     en: 'Captions / Content' },
    'l2.editor.caption.ph':     { th: '📝 เริ่มเขียนเนื้อหาของคุณได้เลย...', en: '📝 Start writing your content...' },
    'l2.editor.hashtags':       { th: '#️⃣ แฮชแท็ก',             en: '#️⃣ Hashtags' },
    'l2.hashtags.placeholder':  { th: '#แฮชแท็ก #ตัวอย่าง',       en: '#hashtags #example' },
    'l2.drawer.title':          { th: '🛠️ AI Tools Drawer',      en: '🛠️ AI Tools Drawer' },
    'l2.confirm.delete':        { th: '⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
                                  en: '⚠️ Are you sure you want to delete this content card? This action cannot be undone.' },
    'l2.magic.loading':         { th: 'กำลังวิเคราะห์...',       en: 'Analyzing...' },
    'l2.magic.done':            { th: '✅ วิเคราะห์เสร็จสิ้น!',    en: '✅ Analysis complete!' },
    'l2.tool.loading':          { th: '🪄 กำลังใช้ AI ({tool})...', en: '🪄 Using AI ({tool})...' },

    /* ═══ LAYER 2 — POST FACTORY ═══ */
    'l2.loading.track':         { th: 'กำลังโหลด...',            en: 'Loading...' },
    'l2.loading.topic':         { th: 'กำลังโหลดหัวข้อ...',      en: 'Loading Topic...' },

    /* ═══ DYNAMIC CONTENT TRANSLATIONS ═══ */
    'special.lottery':          { th: '🔮 วันหวยออก',              en: '🔮 Lottery Day' },
    'special.payday':           { th: '💰 วันเงินเดือนออก',         en: '💰 Payday' },
    'special.weekend':          { th: '🌴 วันหยุดสุดสัปดาห์',      en: '🌴 Weekend Vibe' },
    'track.budget':             { th: '💰 งบประมาณ',               en: '💰 Budget' },
    'track.motivation':         { th: '💪 แรงบันดาลใจ',            en: '💪 Motivation' },
    'track.howto':              { th: '📖 วิธีใช้',                en: '📖 How-To' },
    'track.bts':                { th: '🎬 เบื้องหลัง',            en: '🎬 Behind the Scenes' },
    'track.result':             { th: '🏆 ผลลัพธ์',               en: '🏆 Result' },
    'track.meme':               { th: '😂 มีมฮา',                en: '😂 Meme' },
    'track.blog':               { th: '📝 บทความ',                en: '📝 Blog' },
    'track.news':               { th: '📰 ข่าวสาร',               en: '📰 News' },
    'track.review':             { th: '⭐ รีวิว',                 en: '⭐ Review' },
    'l2.headline.placeholder':  { th: '💡 ใส่พาดหัว (Headline) ที่นี่...',
                                  en: '💡 Enter your headline here...' },
    'l2.caption.placeholder':   { th: '📝 เริ่มเขียนเนื้อหา (Caption) โพสต์ของคุณได้เลย...',
                                  en: '📝 Start writing your post caption here...' },
    'l2.hashtags.label':        { th: '#️⃣ แฮชแท็ก',              en: '#️⃣ Hashtags' },
    'l2.status.label':          { th: '📊 สถานะ',                en: '📊 Status' },
    'l2.drawer.title':          { th: '🧰 เครื่องมือ AI',        en: '🧰 The Drawer' },
    'l2.magic.btn':             { th: '✨ วิเคราะห์ด้วย AI',     en: '✨ Magic Analysis' },
    'l2.magic.result':          { th: '✨ ผลวิเคราะห์จาก AI',    en: '✨ AI Analysis Result' },

    /* Drawer Categories */
    'l2.cat.hooks':             { th: '🪝 หมวดสร้างฮุกดึงดูดใจ (Group 1: 1-15)',
                                  en: '🪝 The Hook Makers (1-15)' },
    'l2.cat.pains':             { th: '🎯 หมวดขยี้จุดเจ็บ (Group 2: 16-30)',
                                  en: '🎯 Pain Point Crushers (16-30)' },
    'l2.cat.auditor':           { th: '🔍 หมวดตรวจสอบคุณภาพ (Group 3: 31-40)',
                                  en: '🔍 The Auditor (31-40)' },
    'l2.cat.graphic':           { th: '🎨 หมวดบรีฟกราฟิก (Group 4: 41-45)',
                                  en: '🎨 Graphic Brief (41-45)' },

    /* --- Tools 1-15: Hooks --- */
    'l2.tool.1':                { th: '⚡ ตัวช่วยสร้างฮุกไวรัล (Viral Hook Generator)', en: '⚡ Viral Hook Generator' },
    'l2.tool.2':                { th: '📖 ฮุกแนวเล่าเรื่อง (Storytelling Hook)', en: '📖 Storytelling Hook' },
    'l2.tool.3':                { th: '🔥 ฮุกประเด็นร้อน (Controversial Hook)', en: '🔥 Controversial Hook' },
    'l2.tool.4':                { th: '❓ ฮุกประโยคคำถาม (Question Hook)', en: '❓ Question Hook' },
    'l2.tool.5':                { th: '📊 ฮุกสถิติน่าตกใจ (Shocking Stat Hook)', en: '📊 Shocking Stat Hook' },
    'l2.tool.6':                { th: '🧠 ฮุกท้าทายความเชื่อ (Belief Challenger)', en: '🧠 Belief Challenger' },
    'l2.tool.7':                { th: '⏰ ฮุกกลัวตกเทรนด์ (FOMO) (Fear of Missing Out)', en: '⏰ Fear of Missing Out' },
    'l2.tool.8':                { th: '🤫 ฮุกความลับความสำเร็จ (The Success Secret)', en: '🤫 The Success Secret' },
    'l2.tool.9':                { th: '❤️ ฮุกสะเทือนอารมณ์ (Emotional Connector)', en: '❤️ Emotional Connector' },
    'l2.tool.10':               { th: '🔍 ฮุกสร้างความสงสัย (The Curiosity Gap)', en: '🔍 The Curiosity Gap' },
    'l2.tool.11':               { th: '✂️ ฮุกสั้นแต่จี๊ด (Short & Punchy Hook)', en: '✂️ Short & Punchy Hook' },
    'l2.tool.12':               { th: '🪜 ฮุกทิ้งปมให้ตามต่อ (Cliffhanger Hook)', en: '🪜 Cliffhanger Hook' },
    'l2.tool.13':               { th: '👑 ฮุกสร้างความน่าเชื่อถือ (The Authority Hook)', en: '👑 The Authority Hook' },
    'l2.tool.14':               { th: '💰 ฮุกบอกผลประโยชน์ตรงๆ (Direct Benefit Hook)', en: '💰 Direct Benefit Hook' },
    'l2.tool.15':               { th: '🌊 ฮุกเกาะกระแสเทรนด์ (Trend-Jack Hook)', en: '🌊 Trend-Jack Hook' },

    /* --- Tools 16-30: Pain Point Crushers --- */
    'l2.tool.16':               { th: '💭 ดึงคำถามที่พบบ่อยมาเล่า (FAQ Puller)', en: '💭 FAQ Puller' },
    'l2.tool.17':               { th: '🥊 สูตรขยี้ปัญหาลูกค้า (PAS) (PAS Framework)', en: '🥊 PAS Framework' },
    'l2.tool.18':               { th: '🛡️ ตัวช่วยตอบข้อโต้แย้ง (Objection Handler)', en: '🛡️ Objection Handler' },
    'l2.tool.19':               { th: '🏹 สูตรปิดการขาย (AIDA) (AIDA Resolver)', en: '🏹 AIDA Resolver' },
    'l2.tool.20':               { th: '💎 เน้นผลลัพธ์เหนือฟีเจอร์ (Benefit over Feature)', en: '💎 Benefit over Feature' },
    'l2.tool.21':               { th: '🛠️ เจาะลึกคำถาม "แล้วไงต่อ?" (The "So What?" Drill)', en: '🛠️ The "So What?" Drill' },
    'l2.tool.22':               { th: '🌉 สะพานเชื่อมความรู้สึก (Relatability Bridge)', en: '🌉 Relatability Bridge' },
    'l2.tool.23':               { th: '🔄 เรื่องเล่าก่อนและหลัง (Before/After Story)', en: '🔄 Before/After Story' },
    'l2.tool.24':               { th: '🚀 ตัวสร้างความเร่งด่วน (Urgency Builder)', en: '🚀 Urgency Builder' },
    'l2.tool.25':               { th: '🤝 ตัวช่วยลดความเสี่ยง (Risk Reversal)', en: '🤝 Risk Reversal' },
    'l2.tool.26':               { th: '⚖️ เปรียบเทียบแบบมือโปร (Comparison Pro)', en: '⚖️ Comparison Pro' },
    'l2.tool.27':               { th: '🎭 เปลี่ยนฟีเจอร์เป็นอารมณ์ (Feature To Emotion)', en: '🎭 Feature To Emotion' },
    'l2.tool.28':               { th: '✍️ ร่างรีวิวแทนลูกค้า (User Review Ghostwriter)', en: '✍️ User Review Ghostwriter' },
    'l2.tool.29':               { th: '🎯 แก้ปัญหาเฉพาะกลุ่ม (Niche Specific Fix)', en: '🎯 Niche Specific Fix' },
    'l2.tool.30':               { th: '✨ ทางออกราวกับปาฏิหาริย์ (The Miracle Solution)', en: '✨ The Miracle Solution' },

    /* --- Tools 31-40: The Auditor --- */
    'l2.tool.31':               { th: '🧹 ตัวตรวจคำต้องห้าม (Ban Word Sweeper)', en: '🧹 Ban Word Sweeper' },
    'l2.tool.32':               { th: '🎭 เช็กน้ำเสียงของแบรนด์ (Tone of Voice Check)', en: '🎭 Tone of Voice Check' },
    'l2.tool.33':               { th: '👸 เช็กว่าตรงกลุ่มเป้าหมายไหม (Persona Match Check)', en: '👸 Persona Match Check' },
    'l2.tool.34':               { th: '📝 ตรวจตัวสะกดและไวยากรณ์ (Grammar & Spell Audit)', en: '📝 Grammar & Spell Audit' },
    'l2.tool.35':               { th: '🎶 เช็กความไหลลื่นของเนื้อหา (Flow & Rhythm Check)', en: '🎶 Flow & Rhythm Check' },
    'l2.tool.36':               { th: '💯 ให้คะแนนความปังของฮุก (Hook Quality Score)', en: '💯 Hook Quality Score' },
    'l2.tool.37':               { th: '📢 เช็กความชัดเจนของคำปิดการขาย (Call to Action Clarity)', en: '📢 Call to Action Clarity' },
    'l2.tool.38':               { th: '#️⃣ ตรวจสอบ SEO และแฮชแท็ก (SEO & Hashtag Audit)', en: '#️⃣ SEO & Hashtag Audit' },
    'l2.tool.39':               { th: '👮 เช็กนโยบายแต่ละแพลตฟอร์ม (Platform Policy Guard)', en: '👮 Platform Policy Guard' },
    'l2.tool.40':               { th: '💎 เก็บงานเนี้ยบขั้นสุดท้าย (Final Polish Check)', en: '💎 Final Polish Check' },

    /* --- Tools 41-45: Graphics --- */
    'l2.tool.41':               { th: '🖼️ ตัวเจนบรีฟรูปภาพ AI (Image Prompt Generator)', en: '🖼️ Image Prompt Generator' },
    'l2.tool.42':               { th: '📐 วางโครงสร้างการจัดวางภาพ (Visual Hierarchy Plan)', en: '📐 Visual Hierarchy Plan' },
    'l2.tool.43':               { th: '🎨 ไกด์คู่สีที่ควรใช้ (Color Palette Guide)', en: '🎨 Color Palette Guide' },
    'l2.tool.44':               { th: '📱 ร่างแบบภาพหน้าปก (Thumbnail Sketcher)', en: '📱 Thumbnail Sketcher' },
    'l2.tool.45':               { th: '🎬 สตอรี่บอร์ดวิดีโอสั้น (Short Video Storyboard)', en: '🎬 Short Video Storyboard' },
  };

  /* ─── Core API ─── */

  /** Get current language */
  function getLang() { return currentLang; }

  /** Translate a key — returns the localized string or the key itself if missing */
  function t(key) {
    const entry = dict[key];
    if (!entry) return key;
    return entry[currentLang] || entry['en'] || key;
  }

  /** Set language and re-apply to DOM */
  function setLang(lang) {
    if (lang !== 'th' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang();
    updateGlobalLanguage();
    // Dispatch event so layer scripts can react
    window.dispatchEvent(new CustomEvent('v6:langChange', { detail: { lang } }));
  }

  /** Toggle between TH and EN */
  function toggle() {
    setLang(currentLang === 'th' ? 'en' : 'th');
  }

  /**
   * Scan the DOM for all elements with data-i18n attributes and update them.
   * Supports:
   *   data-i18n="key"              → updates textContent
   *   data-i18n-placeholder="key"  → updates placeholder attribute
   *   data-i18n-title="key"        → updates title attribute
   *   data-i18n-html="key"         → updates innerHTML (use sparingly)
   */
  function applyLang() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });

    // Placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    // Title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });

    // innerHTML (for elements containing mixed HTML + text)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });

    // Update html lang attribute
    document.documentElement.lang = currentLang === 'th' ? 'th' : 'en';

    // Update toggle button label if present
    const toggle = document.getElementById('langToggle');
    if (toggle) {
      const dot = toggle.querySelector('.lang-active-dot');
      const thLabel = toggle.querySelector('.lang-th');
      const enLabel = toggle.querySelector('.lang-en');
      if (thLabel) thLabel.classList.toggle('active', currentLang === 'th');
      if (enLabel) enLabel.classList.toggle('active', currentLang === 'en');
    }
  }



  /* ═══ Global UI Translation Engine ═══ */
  function updateGlobalLanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translated;
        } else {
          el.textContent = translated;
        }
      }
    });

    // Update all elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = t(key);
      }
    });
  }

  /* ═══ Cross-Tab Language Sync ═══ */
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const newLang = e.newValue || 'th';
      if (newLang !== currentLang) {
        currentLang = newLang;
        applyLang();
        updateGlobalLanguage();
      }
    }
  });

  /* ─── Init: apply once on load ─── */
  // Defer to let HTML render first
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyLang();
      updateGlobalLanguage();
    });
  } else {
    setTimeout(() => {
      applyLang();
      updateGlobalLanguage();
    }, 0);
  }

  return { getLang, t, setLang, toggle, applyLang, dict, updateGlobalLanguage };
})();
