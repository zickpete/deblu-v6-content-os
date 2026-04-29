/* ================================================
   V.6 Content OS — Layer 3: Analytics Engine
   Chart.js + V6Store Integration
   ================================================ */

window.V6Layer3 = (function () {
  'use strict';

  const $ = id => document.getElementById(id);
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
        <li class="l3-tp-item">
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

  function refresh() {
    renderDashboard();
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render on cloud sync
  window.addEventListener('v6:cloudSync', () => { setTimeout(renderDashboard, 500); });

  return { init, exportPDF, exportCSV, exportPNG, refresh };
})();
