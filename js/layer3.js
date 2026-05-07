/* ================================================
   V.6 Content OS — Layer3: Analytics Engine
   Chart.js + V6Store Integration
   ================================================ */

window.V6Layer3 = (function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(msg, type = 'info', dur = 3500) {
    let t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(100%)';
      setTimeout(() => t.remove(), 300);
    }, dur);
  }

  let platformChart = null;
  let viewsConversionsChart = null;

  /* ─── Init ─── */
  function init() {
    console.log('[Layer3] Initializing Analytics Dashboard...');
    renderDashboard();
  }

  /* ─── Main Render ─── */
  function renderDashboard() {
    const allCards = V6Store.listAllCards();
    const cardsWithPerf = allCards.filter(c => c.performance && c.performance.platform);

    if (cardsWithPerf.length === 0) {
      showEmptyState();
      return;
    }

    // Compute stats
    const stats = computeStats(cardsWithPerf);
    renderStats(stats);
    renderPlatformChart(stats);
    renderViewsConversionsChart(stats);
    renderTopPerformers(cardsWithPerf);

    // Hide empty state
    const emptyEl = $('l3EmptyState');
    if (emptyEl) emptyEl.style.display = 'none';
    const dashEl = $('l3Dashboard');
    if (dashEl) dashEl.style.display = 'block';
  }

  /* ─── Stats Computation ─── */
  function computeStats(cards) {
    const platforms = {};
    let totalViews = 0;
    let totalConversions = 0;
    let totalRating = 0;
    let ratingCount = 0;

    cards.forEach(card => {
      let statsArray = card.performanceStats || [];
      if (statsArray.length === 0 && card.performance && card.performance.platform) {
        statsArray = [card.performance]; // backward compatibility
      }

      statsArray.forEach(p => {
        const platform = p.platform || 'Other';

        if (!platforms[platform]) {
          platforms[platform] = { views: 0, conversions: 0, count: 0, totalRating: 0, ratingCount: 0 };
        }

        const views = Number(p.views) || 0;
        const conversions = Number(p.conversions) || 0;
        const rating = Number(p.rating) || 0;

        platforms[platform].views += views;
        platforms[platform].conversions += conversions;
        platforms[platform].count += 1;

        if (rating > 0) {
          platforms[platform].totalRating += rating;
          platforms[platform].ratingCount += 1;
        }

        totalViews += views;
        totalConversions += conversions;
        if (rating > 0) {
          totalRating += rating;
          ratingCount += 1;
        }
      });
    });

    return {
      platforms,
      totalViews,
      totalConversions,
      totalCards: cards.length,
      avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '—'
    };
  }

  /* ─── Render Summary Stats ─── */
  function renderStats(stats) {
    $('statTotalCards').textContent = stats.totalCards.toLocaleString();
    $('statTotalViews').textContent = formatNumber(stats.totalViews);
    $('statTotalConversions').textContent = formatNumber(stats.totalConversions);
    $('statAvgRating').textContent = stats.avgRating;
  }

  /* ─── Platform Comparison Chart ─── */
  function renderPlatformChart(stats) {
    const ctx = $('platformChart');
    if (!ctx) return;

    const labels = Object.keys(stats.platforms);
    const viewsData = labels.map(p => stats.platforms[p].views);
    const convData = labels.map(p => stats.platforms[p].conversions);

    const platformColors = {
      'Facebook':  { bg: 'rgba(59, 130, 246, 0.7)',  border: '#3b82f6' },
      'TikTok':    { bg: 'rgba(236, 72, 153, 0.7)',  border: '#ec4899' },
      'Instagram': { bg: 'rgba(168, 85, 247, 0.7)',  border: '#a855f7' },
      'Other':     { bg: 'rgba(107, 114, 128, 0.7)', border: '#6b7280' },
    };

    const bgColors = labels.map(l => (platformColors[l] || platformColors['Other']).bg);
    const borderColors = labels.map(l => (platformColors[l] || platformColors['Other']).border);

    if (platformChart) platformChart.destroy();

    platformChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Views',
            data: viewsData,
            backgroundColor: bgColors.map(c => c.replace('0.7', '0.5')),
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Conversions',
            data: convData,
            backgroundColor: bgColors.map(c => c.replace('0.7', '0.8')),
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: "'Manrope', sans-serif", weight: '600', size: 11 }, padding: 16 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(166, 140, 255, 0.3)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            titleFont: { family: "'Manrope', sans-serif", weight: '700', size: 13 },
            bodyFont:  { family: "'Manrope', sans-serif", weight: '500', size: 12 },
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748b', font: { family: "'Manrope', sans-serif", weight: '600', size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748b', font: { family: "'Manrope', sans-serif", weight: '600', size: 11 } }
          }
        }
      }
    });
  }

  /* ─── Views vs Conversions Doughnut ─── */
  function renderViewsConversionsChart(stats) {
    const ctx = $('viewsConversionsChart');
    if (!ctx) return;

    if (viewsConversionsChart) viewsConversionsChart.destroy();

    const labels = Object.keys(stats.platforms);
    const viewsData = labels.map(p => stats.platforms[p].views);

    const colors = [
      'rgba(166, 140, 255, 0.75)',
      'rgba(236, 72, 153, 0.75)',
      'rgba(168, 85, 247, 0.75)',
      'rgba(129, 236, 255, 0.75)',
      'rgba(251, 191, 36, 0.75)',
    ];

    viewsConversionsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: viewsData,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: 'rgba(7, 14, 31, 0.8)',
          borderWidth: 3,
          hoverOffset: 12,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: "'Manrope', sans-serif", weight: '600', size: 11 }, padding: 16, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(166, 140, 255, 0.3)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
          }
        }
      }
    });
  }

  /* ─── Top Performers List ─── */
  function renderTopPerformers(cards) {
    const listEl = $('topPerformersList');
    if (!listEl) return;

    // Aggregate stats per card
    const aggregatedCards = cards.map(card => {
      let statsArray = card.performanceStats || [];
      if (statsArray.length === 0 && card.performance && card.performance.platform) {
        statsArray = [card.performance]; // backward compatibility
      }

      let totalViews = 0;
      let totalConversions = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let platforms = new Set();

      statsArray.forEach(p => {
        totalViews += Number(p.views) || 0;
        totalConversions += Number(p.conversions) || 0;
        platforms.add(p.platform || 'Other');
        const r = Number(p.rating) || 0;
        if (r > 0) {
          totalRating += r;
          ratingCount++;
        }
      });

      return {
        card,
        totalViews,
        totalConversions,
        platforms: Array.from(platforms).join(', ') || 'N/A',
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0
      };
    });

    // Sort by conversions desc, then views desc
    const sorted = aggregatedCards.sort((a, b) => {
      if (b.totalConversions !== a.totalConversions) return b.totalConversions - a.totalConversions;
      return b.totalViews - a.totalViews;
    });

    const top = sorted.slice(0, 10);

    listEl.innerHTML = top.map((agg, i) => {
      const { card, totalViews, totalConversions, platforms, avgRating } = agg;
      const name = card.meta_headline || card.suggested_topic || card.topic_th || card.topic_en || 'Untitled';
      const stars = renderStars(avgRating);

      const rankClass = i < 3 ? `rank-${i + 1}` : 'rank-other';
      const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);

      return `
        <li class="l3-tp-item" role="button" tabindex="0" onclick="V6Layer3.showPostDetails('${card.id}')">
          <div class="l3-tp-rank ${rankClass}">${rankLabel}</div>
          <div class="l3-tp-info">
            <div class="l3-tp-name">${escapeHtml(name)}</div>
            <div class="l3-tp-meta">
              <span>📱 ${escapeHtml(platforms)}</span>
              <span>👁️ ${totalViews.toLocaleString()}</span>
              <span>💰 ${totalConversions.toLocaleString()}</span>
            </div>
          </div>
          <div class="l3-tp-stars">${stars}</div>
          <div class="l3-tp-metric">
            <span class="l3-tp-metric-value">${totalConversions.toLocaleString()}</span>
            <span class="l3-tp-metric-label">Sales</span>
          </div>
        </li>
      `;
    }).join('');
  }

  /* ─── Helpers ─── */
  function renderStars(rating) {
    const full = Math.floor(Math.min(rating, 5));
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showEmptyState() {
    const emptyEl = $('l3EmptyState');
    if (emptyEl) emptyEl.style.display = 'block';
    const dashEl = $('l3Dashboard');
    if (dashEl) dashEl.style.display = 'none';
  }

  function exportPDF() {
    window.print();
  }

  function exportCSV() {
    const allCards = V6Store.listAllCards();
    const cardsWithPerf = allCards.filter(c => (c.performanceStats && c.performanceStats.length > 0) || (c.performance && c.performance.platform));
    
    if (cardsWithPerf.length === 0) {
      alert(V6i18n.t('l3.empty.title') || 'No performance data to export.');
      return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for UTF-8
    csvContent += "Date,Title/Topic,Platform,Views,Sales/Conversions,Rating\n";

    // Rows
    cardsWithPerf.forEach(card => {
      const date = card.date || '';
      const name = card.meta_headline || card.suggested_topic || card.topic_th || card.topic_en || 'Untitled';
      const safeName = `"${name.replace(/"/g, '""')}"`;
      
      let statsArray = card.performanceStats || [];
      if (statsArray.length === 0 && card.performance && card.performance.platform) {
        statsArray = [card.performance]; // backward compatibility
      }

      statsArray.forEach(p => {
        const platform = p.platform || '';
        const views = p.views || 0;
        const conversions = p.conversions || 0;
        const rating = p.rating || 0;

        csvContent += `${date},${safeName},${platform},${views},${conversions},${rating}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BAM_OS_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPNG() {
    const dashboard = $('mainContent');
    if (!dashboard || typeof html2canvas === 'undefined') {
      alert('Error: html2canvas library not loaded or dashboard not found.');
      return;
    }

    // Hide export bar temporarily for clean capture
    const exportBar = document.querySelector('.l3-export-bar');
    if (exportBar) exportBar.style.display = 'none';

    html2canvas(dashboard, {
      backgroundColor: '#070e1f', // Match background
      scale: 2 // High resolution
    }).then(canvas => {
      // Restore export bar
      if (exportBar) exportBar.style.display = 'flex';

      const link = document.createElement('a');
      link.download = `BAM_OS_Dashboard_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      if (exportBar) exportBar.style.display = 'flex';
      console.error('Error generating PNG:', err);
      alert('Failed to generate image. See console for details.');
    });
  }

  async function exportToPPTX() {
    if (typeof pptxgen === 'undefined') {
      alert('Error: PptxGenJS library not loaded.');
      return;
    }

    const allCards = V6Store.listAllCards();
    const cardsWithPerf = allCards.filter(c => (c.performanceStats && c.performanceStats.length > 0) || (c.performance && c.performance.platform));

    if (cardsWithPerf.length === 0) {
      alert('No performance data to export.');
      return;
    }

    const btn = $('exportPptxBtn');
    const originalBtnHTML = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span> 🤖 AI Generating...`;
    }

    try {
      // 1. Data Aggregation (Self-audit: Handle array structure safely)
      let totalViews = 0;
      let totalSales = 0;
      let platformData = { 'TikTok': { views: 0, sales: 0 }, 'Facebook': { views: 0, sales: 0 }, 'Instagram': { views: 0, sales: 0 }, 'Other': { views: 0, sales: 0 } };
      let topCards = [];

      cardsWithPerf.forEach(card => {
        const name = card.meta_headline || card.suggested_topic || card.topic_th || card.topic_en || 'Untitled';
        let statsArray = card.performanceStats || [];
        if (statsArray.length === 0 && card.performance && card.performance.platform) {
          statsArray = [card.performance];
        }

        let cardViews = 0;
        let cardSales = 0;
        let cardPlatforms = new Set();

        statsArray.forEach(p => {
          const pViews = Number(p.views) || 0;
          const pSales = Number(p.conversions) || 0;
          const pName = p.platform || 'Other';
          
          totalViews += pViews;
          totalSales += pSales;
          cardViews += pViews;
          cardSales += pSales;
          cardPlatforms.add(pName);

          if (platformData[pName]) {
            platformData[pName].views += pViews;
            platformData[pName].sales += pSales;
          } else {
            platformData['Other'].views += pViews;
            platformData['Other'].sales += pSales;
          }
        });

        topCards.push({ title: name, views: cardViews, sales: cardSales, platforms: Array.from(cardPlatforms).join(', ') });
      });

      // Sort for top performers
      topCards.sort((a, b) => b.views - a.views);

      // --- AI API CALL ---
      let aiSlides = [];
      const isApiKeyAvailable = !!localStorage.getItem('v6_settings_apiKey');
      
      if (isApiKeyAvailable) {
        const systemPrompt = `You are an expert Content Strategist & Data Analyst for Deblu Thailand (a premium footwear brand).
Your task is to analyze social media performance data and output an insightful presentation.
Output MUST be a strict JSON array of objects. Each object represents one slide.
Format exactly like this (NO markdown blocks, NO backticks outside of the JSON string if possible, just raw JSON array):
[
  {
    "title": "Insight Slide Title",
    "bullets": ["Bullet point 1 analyzing the data", "Bullet point 2 with an actionable recommendation"]
  }
]
Generate 2 to 4 highly professional, analytical slides based on the provided data. Tone: Professional and encouraging. Language: Thai.`;

        let summaryText = `Total Views: ${totalViews}\nTotal Sales: ${totalSales}\n`;
        summaryText += `TikTok: ${platformData['TikTok'].views} views, ${platformData['TikTok'].sales} sales\n`;
        summaryText += `Facebook: ${platformData['Facebook'].views} views, ${platformData['Facebook'].sales} sales\n`;
        summaryText += `Instagram: ${platformData['Instagram'].views} views, ${platformData['Instagram'].sales} sales\n`;
        summaryText += `Top 3 Posts:\n`;
        topCards.slice(0, 3).forEach((p, i) => { summaryText += `${i+1}. ${p.title} (${p.platforms}) - Views: ${p.views}\n`; });

        try {
          const aiResponseRaw = await V6AI.generateCustomResponse(systemPrompt, `Here is the data:\n${summaryText}`);
          const start = aiResponseRaw.indexOf('[');
          const end = aiResponseRaw.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
            aiSlides = JSON.parse(aiResponseRaw.slice(start, end + 1));
          } else {
            throw new Error("No JSON array found in response");
          }
        } catch (e) {
          console.error("Failed to fetch or parse AI slide response:", e);
          toast("AI Analysis failed or returned invalid format. Generating standard report instead.", "error");
        }
      }

      // 2. Initialize PPTX (Dark/Minimalist Theme)
      let pptx = new pptxgen();
      pptx.author = 'BAM OS v.6.1';
      pptx.company = 'deblu Thailand';
      pptx.title = 'Monthly Performance Report';

      const bgDark = "0F172A";
      const textWhite = "F8FAFC";
      const textMuted = "94A3B8";
      const accentPrimary = "3B82F6";
      const accentSecondary = "EC4899";

      // Slide 1: Cover
      let slide1 = pptx.addSlide();
      slide1.background = { color: bgDark };
      slide1.addText("deblu Content OS - Monthly Performance Report", { 
        x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 32, color: textWhite, align: "center", bold: true 
      });
      const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      slide1.addText(currentDate, { 
        x: 0.5, y: 3.5, w: 9, h: 1, fontSize: 18, color: textMuted, align: "center" 
      });

      // Slide 2: Executive Summary
      let slide2 = pptx.addSlide();
      slide2.background = { color: bgDark };
      slide2.addText("Executive Summary", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, color: textWhite, bold: true });
      
      slide2.addShape(pptx.ShapeType.rect, { x: 1, y: 2, w: 3.5, h: 2, fill: "1E293B", roundness: 0.1 });
      slide2.addText("Total Views", { x: 1, y: 2.2, w: 3.5, h: 0.5, fontSize: 18, color: textMuted, align: "center" });
      slide2.addText(totalViews.toLocaleString(), { x: 1, y: 2.7, w: 3.5, h: 1, fontSize: 36, color: accentPrimary, align: "center", bold: true });

      slide2.addShape(pptx.ShapeType.rect, { x: 5.5, y: 2, w: 3.5, h: 2, fill: "1E293B", roundness: 0.1 });
      slide2.addText("Total Sales", { x: 5.5, y: 2.2, w: 3.5, h: 0.5, fontSize: 18, color: textMuted, align: "center" });
      slide2.addText(totalSales.toLocaleString(), { x: 5.5, y: 2.7, w: 3.5, h: 1, fontSize: 36, color: accentSecondary, align: "center", bold: true });

      // Slide 3: Platform Comparison
      let slide3 = pptx.addSlide();
      slide3.background = { color: bgDark };
      slide3.addText("Platform Comparison", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, color: textWhite, bold: true });

      let chartData = [
        {
          name: "Views",
          labels: ["TikTok", "Facebook", "Instagram"],
          values: [platformData['TikTok'].views, platformData['Facebook'].views, platformData['Instagram'].views]
        },
        {
          name: "Sales",
          labels: ["TikTok", "Facebook", "Instagram"],
          values: [platformData['TikTok'].sales, platformData['Facebook'].sales, platformData['Instagram'].sales]
        }
      ];

      slide3.addChart(pptx.ChartType.bar, chartData, { 
        x: 0.5, y: 1.5, w: 9, h: 3.5, 
        barDir: 'col', 
        showLegend: true,
        legendPos: 't',
        legendColor: textMuted,
        chartColors: [accentPrimary, accentSecondary],
        valAxisLabelColor: textMuted,
        catAxisLabelColor: textMuted,
        valGridLine: { color: "1E293B" },
        showValue: true,
        valAxisLabelFormatCode: '#,##0'
      });

      // Slide 4: Top Performers
      let slide4 = pptx.addSlide();
      slide4.background = { color: bgDark };
      slide4.addText("Top 3 Performers", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, color: textWhite, bold: true });

      let tableData = [
        [
          { text: "Rank", options: { bold: true, color: textWhite, fill: "1E293B" } },
          { text: "Title", options: { bold: true, color: textWhite, fill: "1E293B" } },
          { text: "Platform(s)", options: { bold: true, color: textWhite, fill: "1E293B" } },
          { text: "Views", options: { bold: true, color: textWhite, fill: "1E293B", align: "right" } }
        ]
      ];

      const top3 = topCards.slice(0, 3);
      top3.forEach((post, idx) => {
        tableData.push([
          { text: `#${idx + 1}`, options: { color: accentSecondary, bold: true } },
          { text: post.title, options: { color: textWhite } },
          { text: post.platforms, options: { color: textMuted } },
          { text: post.views.toLocaleString(), options: { color: accentPrimary, bold: true, align: "right" } }
        ]);
      });

      slide4.addTable(tableData, { 
        x: 0.5, y: 1.5, w: 9, 
        fill: "0F172A", 
        border: { type: "solid", color: "1E293B", pt: 1 },
        colW: [0.8, 4.2, 2.0, 2.0],
        fontSize: 14
      });

      // --- DYNAMIC AI SLIDES ---
      if (aiSlides && aiSlides.length > 0) {
        aiSlides.forEach(aiSlide => {
          let s = pptx.addSlide();
          s.background = { color: bgDark };
          
          // AI Title
          s.addText(`🤖 ${aiSlide.title || 'AI Analysis'}`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, color: "A68CFF", bold: true });
          
          // AI Bullets
          if (Array.isArray(aiSlide.bullets) && aiSlide.bullets.length > 0) {
            let bulletText = aiSlide.bullets.map(b => ({ text: b, options: { bullet: true, color: textWhite, fontSize: 18, breakLine: true } }));
            s.addText(bulletText, { x: 0.5, y: 1.5, w: 8, h: 3.5, valign: 'top', lineSpacing: 32 });
          }
        });
      }

      // Save
      pptx.writeFile({ fileName: `deblu_Performance_Report_${new Date().toISOString().split('T')[0]}.pptx` });

    } catch (err) {
      console.error(err);
      alert(`Error generating PPTX: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHTML;
      }
    }
  }

  async function generateInsights() {
    const box = $('aiInsightBox');
    const btn = $('genInsightBtn');
    
    // 1. Get current stats
    const cards = V6Store.getCards();
    const stats = calculateStats(cards);
    
    if (cards.length === 0) {
      toast('ไม่มีข้อมูลสำหรับวิเคราะห์', 'error');
      return;
    }

    // 2. Loading state
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span> กำลังประมวลผลด้วย AI...`;
    }
    
    // 3. Prepare data for AI
    const platformsText = Object.entries(stats.platforms).map(([p, s]) => 
      `- ${p}: ${s.views} views, ${s.conversions} conversions, Avg Rating: ${(s.totalRating / s.ratingCount || 0).toFixed(1)}`
    ).join('\n');

    const topCards = cards
      .filter(c => c.performanceStats && c.performanceStats.length > 0)
      .sort((a, b) => {
        const aConv = a.performanceStats.reduce((sum, p) => sum + (Number(p.conversions) || 0), 0);
        const bConv = b.performanceStats.reduce((sum, p) => sum + (Number(p.conversions) || 0), 0);
        return bConv - aConv;
      })
      .slice(0, 3)
      .map(c => `- ${c.customTitle || c.title}: ${c.performanceStats.reduce((sum, p) => sum + (Number(p.conversions) || 0), 0)} conversions`)
      .join('\n');

    const systemPrompt = `คุณคือ AI Content Strategist ประจำระบบ BAM OS v.6.1 (Deblu Thailand). 
วิเคราะห์แนวโน้มและโอกาสจากข้อมูลประสิทธิภาพคอนเทนต์ล่าสุด`;

    const userPrompt = `
สรุปภาพรวมข้อมูล:
- คอนเทนต์ทั้งหมด: ${stats.totalCards} ชิ้น
- ยอดวิวรวม: ${stats.totalViews}
- ยอดขายรวม: ${stats.totalConversions}
- เรตติ้งเฉลี่ย: ${stats.avgRating}

ประสิทธิภาพรายแพลตฟอร์ม:
${platformsText}

คอนเทนต์ที่ทำได้ดีที่สุด (Top Performers):
${topCards}

โจทย์: 
1. วิเคราะห์แนวโน้ม (Trends) ว่าแพลตฟอร์มไหนทำได้ดีที่สุดเพราะอะไร
2. ให้คำแนะนำ (Actionable Advice) 3 ข้อ เพื่อเพิ่มยอดขาย (Conversions) ในเดือนถัดไป
3. สรุปภาพรวมเป็นประโยคที่ให้กำลังใจและดูเป็นมืออาชีพ

ตอบเป็นภาษาไทย โดยใช้ Markdown (ใช้ h3 สำหรับหัวข้อ และ bullet points)
    `;

    try {
      // 4. Call AI
      const result = await V6AI.generateCustomResponse(systemPrompt, userPrompt);
      
      // 5. Render result
      box.innerHTML = `
        <h3 style="margin-bottom: 12px; color: #a68cff; display: flex; align-items: center; gap: 8px;">
          ✨ Executive Summary (AI Analysis)
        </h3>
        <div class="ai-insight-content" style="color: #F8FAFC; line-height: 1.6; font-size: 14px;">
          ${V6AI.formatMarkdown(result)}
          <button class="btn btn-secondary" style="margin-top:20px; font-size:12px; padding:8px 20px;" onclick="V6Layer3.generateInsights()">
            🔄 วิเคราะห์ใหม่ (Regenerate)
          </button>
        </div>
      `;
    } catch (err) {
      if (err.message === 'KEY_MISSING') {
         box.innerHTML = `
           <h3 style="margin-bottom: 12px; color: #a68cff; display: flex; align-items: center; gap: 8px;">
             ✨ Executive Summary
           </h3>
           <div style="color:#ef4444; padding:20px;">
             ⚠️ ไม่พบ API Key กรุณาใส่ API Key ในหน้า Settings (Layer 0)
           </div>
         `;
      } else {
        toast(`Error: ${err.message}`, 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `✨ วิเคราะห์ข้อมูล (Generate Insights)`;
        }
      }
    }
  }

  function refresh() {
    renderDashboard();
  }

  /* ─── Modal Functions ─── */
  function showPostDetails(cardId) {
    const card = V6Store.getCard(cardId);
    if (!card) return;

    // 1. Title
    const finalTitle = card.customTitle || card.meta_headline || card.suggested_topic || card.topic_th || card.topic_en || 'Untitled';
    $('l3DetailTitle').textContent = finalTitle;

    // 2. Content
    $('l3DetailContent').textContent = card.postContent || card.caption || card.description || 'ไม่มีเนื้อหา (No content provided)';

    // 3. Stats Summary
    let statsArray = card.performanceStats || [];
    if (statsArray.length === 0 && card.performance && card.performance.platform) {
      statsArray = [card.performance];
    }
    
    let statsHtml = '';
    if (statsArray.length === 0) {
      statsHtml = 'ไม่มีข้อมูลสถิติ (No performance data)';
    } else {
      statsArray.forEach(p => {
        statsHtml += `
          <div style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
            <strong style="color: #e2e8f0;">📱 ${escapeHtml(p.platform || 'Other')}</strong><br/>
            👁️ Views: ${(Number(p.views) || 0).toLocaleString()} &nbsp;|&nbsp; 
            💰 Sales: ${(Number(p.conversions) || 0).toLocaleString()} &nbsp;|&nbsp; 
            ⭐ Rating: ${p.rating ? renderStars(Number(p.rating)) : 'ไม่มี'}
          </div>
        `;
      });
    }
    $('l3DetailStats').innerHTML = statsHtml;

    // 4. Show Modal
    const overlay = $('l3DetailOverlay');
    const modal = $('l3DetailModal');
    if (overlay) {
      overlay.classList.add('open');
      overlay.style.display = 'block';
    }
    if (modal) modal.style.display = 'block';
    document.body.classList.add('modal-active');
    
    // Add temporary Escape listener
    document.addEventListener('keydown', handleEscapeKey);
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closePostDetails();
    }
  }

  function closePostDetails() {
    const overlay = $('l3DetailOverlay');
    const modal = $('l3DetailModal');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.style.display = 'none';
    }
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-active');
    document.removeEventListener('keydown', handleEscapeKey);
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render on cloud sync
  window.addEventListener('v6:cloudSync', () => { setTimeout(renderDashboard, 500); });

  return { init, exportPDF, exportCSV, exportPNG, exportToPPTX, refresh, generateInsights, showPostDetails, closePostDetails };
})();
