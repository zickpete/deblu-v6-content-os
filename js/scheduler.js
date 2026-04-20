/* ================================================
   V.6 Content OS — Scheduler (Layer 1)
   Pure distribution algorithm — no DOM, no side effects
   ================================================ */

window.V6Scheduler = (function () {

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DAY_NAMES_TH= ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];

  /* ─── Date Utilities ─── */

  function parseMonthLabel(label) {
    // "May 2026" → { year: 2026, monthIndex: 4 }
    const [name, yr] = label.split(' ');
    return { year: parseInt(yr), monthIndex: MONTH_NAMES.indexOf(name) };
  }

  function getDaysInMonth(monthLabel) {
    const { year, monthIndex } = parseMonthLabel(monthLabel);
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const days  = [];
    for (let d = 1; d <= count; d++) {
      days.push(new Date(year, monthIndex, d));
    }
    return days;
  }

  function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* ─── Day Classification (Rule A) ─── */

  function classifyDay(date) {
    const rules   = V6_CONFIG.specialDayRules;
    const day     = date.getDate();
    const dow     = date.getDay(); // 0=Sun, 6=Sat
    const isWknd  = dow === 0 || dow === 6;
    const isLotto = rules.lotteryDays.includes(day);
    const isPay   = day >= rules.paydayFrom;

    const tags = [];
    if (isLotto) tags.push(rules.lotteryLabel);  // highest priority
    if (isPay  ) tags.push(rules.paydayLabel);
    if (isWknd ) tags.push(rules.weekendLabel);

    return { isLotto, isPay, isWknd, isSpecial: tags.length > 0, tags };
  }

  /* ─── Weighted Round-Robin (Rule B) ─── */

  function buildRatioPattern(tracks, totalSlots) {
    // Allocate slots proportionally
    let slots = tracks.map((t, i) => ({
      i,
      name:  t.track_name,
      count: Math.round((t.content_ratio / 100) * totalSlots),
    }));

    // Fix rounding so total === totalSlots
    const got = slots.reduce((s, x) => s + x.count, 0);
    const diff = totalSlots - got;
    if (diff !== 0) {
      // Give the delta to the largest track
      const max = slots.reduce((a, b) => a.count > b.count ? a : b);
      max.count += diff;
    }

    // Interleave: spread shorter tracks evenly using largest-remainder style
    const pattern = [];
    const rem = slots.map(s => ({ ...s }));
    while (pattern.length < totalSlots) {
      // One pass: emit one from each track (if remaining), cycle until done
      for (const s of rem) {
        if (s.count > 0 && pattern.length < totalSlots) {
          pattern.push(s.i);
          s.count--;
        }
      }
    }
    return pattern; // array of track indices
  }

  /* ─── Find Best Track by Role ─── */

  function findTrackByRole(tracks, role) {
    // role: 'promo' | 'lifestyle'
    const promoKw = /โปร|promo|sale|discount/i;
    const lifeKw  = /สาย|ลุย|life|active|fun|engage/i;
    const kw = role === 'promo' ? promoKw : lifeKw;
    const found = tracks.find(t => kw.test(t.track_name));
    return found ? tracks.indexOf(found) : 0; // fallback track 0
  }

  /* ─── Main: Build Schedule ─── */

  /**
   * Build a full ContentCard array for the given strategy.
   * All cards start with suggested_topic = null (filled later by AI batch).
   * @param {object} strategy — approved MonthlyStrategy
   * @returns {ContentCard[]}
   */
  function buildSchedule(strategy) {
    const tracks    = strategy.campaign_tracks || [];
    const rules     = V6_CONFIG.specialDayRules;
    const allDates  = getDaysInMonth(strategy.month);

    // Separate dates into Special vs Standard
    const specialDates  = [];
    const standardDates = [];

    allDates.forEach(date => {
      const info = classifyDay(date);
      if (info.isLotto) {
        specialDates.push({ date, info, role: 'lottery' });
      } else {
        standardDates.push({ date, info });
      }
    });

    // Build ratio pattern for standard days
    const pattern = buildRatioPattern(tracks, standardDates.length);

    // Assign tracks to standard days
    let stdIdx = 0;
    const cards = [];
    let cardNum = 1;

    allDates.forEach(date => {
      const info     = classifyDay(date);
      const isoDate  = toISODate(date);
      const dow      = date.getDay();
      const id       = `card_${isoDate.replace(/-/g, '')}_${String(cardNum).padStart(3,'0')}`;
      const dayName  = DAY_NAMES[dow];
      const dayNameTh= DAY_NAMES_TH[dow];

      let trackIdx, trackName, specialTag;

      if (info.isLotto) {
        // Lottery Day — fixed track
        trackIdx   = -1; // special / override
        trackName  = rules.lotteryTrack;
        specialTag = info.tags.join(' · ');
      } else {
        // Standard (may still have Payday or Weekend tags)
        trackIdx  = pattern[stdIdx % pattern.length];
        stdIdx++;

        // Override track preference for Payday → prioritize Promo
        if (info.isPay && !info.isWknd) {
          const promoIdx = findTrackByRole(tracks, 'promo');
          trackIdx = promoIdx;
        }
        // Weekend → prioritize Lifestyle (but don't override Payday promo)
        else if (info.isWknd && !info.isPay) {
          const lifeIdx = findTrackByRole(tracks, 'lifestyle');
          trackIdx = lifeIdx;
        }

        trackName  = (tracks[trackIdx] || tracks[0] || {}).track_name || 'General';
        specialTag = info.tags.length ? info.tags.join(' · ') : null;
      }

      cards.push({
        id,
        strategy_id:     strategy.id,
        date:            isoDate,
        day_of_week:     dayName,
        day_of_week_th:  dayNameTh,
        day_number:      date.getDate(),
        track_name:      trackName,
        track_index:     trackIdx,
        special_tag:     specialTag,
        suggested_topic: null,   // filled by V6AI.generateTopics()
        status:          'Idea',
        created_at:      new Date().toISOString(),
      });

      cardNum++;
    });

    console.log('[V6Scheduler] Built', cards.length, 'cards for', strategy.month);
    return cards;
  }

  /* ─── Stats Helper ─── */

  function getStats(cards) {
    const byStatus = {};
    V6_CONFIG.kanbanStatuses.forEach(s => { byStatus[s.id] = 0; });
    cards.forEach(c => { if (byStatus[c.status] !== undefined) byStatus[c.status]++; });

    const byTrack = {};
    cards.forEach(c => {
      byTrack[c.track_name] = (byTrack[c.track_name] || 0) + 1;
    });

    const specials = cards.filter(c => c.special_tag).length;

    return { total: cards.length, byStatus, byTrack, specials };
  }

  return { buildSchedule, getDaysInMonth, toISODate, getStats };
})();
