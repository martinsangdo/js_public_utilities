//get max and min values of data
function get_max_values(){
    var max_value = 0;
    var min_value = Number.MAX_VALUE;
    for (year in BAR_DATA){
        for (key in BAR_DATA[year]){
            max_value = Math.max(max_value, BAR_DATA[year][key]);
            if (BAR_DATA[year][key] != 0){
                min_value = Math.min(min_value, BAR_DATA[year][key])
            }
        }
    }
    print(min_value);
    print(max_value);
}

function setCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    // Width is CSS width; height is CSS height.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing operations back to CSS pixels
    ctx.imageSmoothingEnabled = true;
  }

  function niceMax(rawMax) {
    // Expand max to a "nice" round number for ticks
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const n = rawMax / pow10;
    let nice;
    if (n <= 1) nice = 1;
    else if (n <= 2) nice = 2;
    else if (n <= 5) nice = 5;
    else nice = 10;
    return nice * pow10;
  }

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, h / 2, w / 2);
    const p = new Path2D();
    p.moveTo(x + rr, y);
    p.arcTo(x + w, y, x + w, y + h, rr);
    p.arcTo(x + w, y + h, x, y + h, rr);
    p.arcTo(x, y + h, x, y, rr);
    p.arcTo(x, y, x + w, y, rr);
    p.closePath();
    return p;
  }

  function drawBars() {
    setCanvasSize();

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Plot area
    const plotX = margins.left;
    const plotY = margins.top;
    const plotW = width - margins.left - margins.right;
    const plotH = height - margins.top - margins.bottom;

    // Compute scales
    const maxValue = Math.max(...data.map(d => d.value));
    const xMax = niceMax(maxValue * 1.1);
    const xScale = (val) => (val / xMax) * plotW;

    const n = data.length; // should be 10
    const bandH = plotH / n;     // band per category
    const barGap = Math.min(16, bandH * 0.25);
    const barH = Math.max(14, bandH - barGap);

    // Grid lines + x-axis labels
    ctx.save();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
    ctx.lineWidth = 1;
    ctx.textBaseline = 'top';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';

    for (let i = 0; i <= gridLineCount; i++) {
      const t = i / gridLineCount;
      const x = plotX + t * plotW;
      // grid line
      ctx.beginPath();
      ctx.moveTo(x, plotY);
      ctx.lineTo(x, plotY + plotH);
      ctx.stroke();
      // tick label
      const val = Math.round(t * xMax);
      const text = Intl.NumberFormat().format(val);
      const tw = ctx.measureText(text).width;
      ctx.fillText(text, x - tw / 2, plotY + plotH + 8);
    }
    ctx.restore();

    // Y labels + bars
    barRects = [];
    const barFill = getComputedStyle(document.documentElement).getPropertyValue('--bar').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    const muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();

    ctx.font = '13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;

    data.forEach((d, idx) => {
      const cy = plotY + idx * bandH + bandH / 2;
      const y = cy - barH / 2;
      const w = Math.max(0, xScale(d.value));

      // category label (left)
      ctx.fillStyle = muted;
      const labelY = cy;
      const labelX = plotX - 10; // right aligned into margin
      ctx.textAlign = 'right';
      ctx.fillText(d.label, labelX, labelY);

      // bar
      ctx.fillStyle = barFill;
      const barX = plotX;
      const barPath = roundRectPath(barX, y, w, barH, barRadius);
      ctx.fill(barPath);

      // value at end of bar
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      const valText = Intl.NumberFormat().format(d.value);
      const tx = barX + w + 8;
      const ty = cy;
      // Keep text inside plot when bar is short
      const inside = w > 56;
      if (inside) {
        ctx.fillStyle = '#0b0f14';
        ctx.save();
        // Draw value inside the bar with a subtle "chip"
        const chipPaddingX = 6;
        const chipPaddingY = 3;
        const metrics = ctx.measureText(valText);
        const chipW = metrics.width + chipPaddingX * 2;
        const chipH = 18;
        const chipX = Math.min(barX + w - chipW - 6, barX + w - chipW - 6);
        const chipY = ty - chipH / 2;
        const chip = roundRectPath(chipX, chipY, chipW, chipH, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill(chip);
        ctx.fillStyle = '#0b0f14';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valText, chipX + chipW / 2, ty);
        ctx.restore();
      } else {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(valText, tx, ty);
      }

      // Save rect for hover (in CSS pixels)
      barRects.push({
        x: barX,
        y: y,
        w: w,
        h: barH,
        label: d.label,
        value: d.value
      });
    });
  }

  function updateTooltip(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    const found = barRects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (found) {
      tooltip.style.left = `${evt.clientX}px`;
      tooltip.style.top = `${evt.clientY}px`;
      tooltip.innerHTML = `<strong>${found.label}</strong><br/>${Intl.NumberFormat().format(found.value)}`;
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0';
    }
  }

  function shuffleValues() {
    for (const d of data) {
      d.value = Math.round(10 + Math.random() * 90);
    }
    drawChart();
  }

  function downloadPNG() {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horizontal-bar-chart.png';
    a.click();
  }
