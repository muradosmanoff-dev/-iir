// ── BURAYA CLOUDFLARE WORKER URL-İNİ YAZ ──
// Məsələn: 'https://muddy-truth-3a09.benbenbenben4000.workers.dev'
const PROXY_URL = 'https://yellow-grass-baff.hsnhlm849.workers.dev/';

// ── Stars canvas ──
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = Array.from({length: 160}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    alpha: Math.random() * 0.6 + 0.1,
    speed: Math.random() * 0.0006 + 0.0002,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawStars(ts) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    const a = s.alpha * (0.5 + 0.5 * Math.sin(ts * s.speed + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,245,200,${a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

resizeCanvas();
initStars();
requestAnimationFrame(drawStars);
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });

// ── Chip selection ──
function initChips(groupId) {
  document.getElementById(groupId).querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById(groupId).querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}
initChips('styleGroup');
initChips('lengthGroup');

function getActive(groupId) {
  const el = document.getElementById(groupId).querySelector('.chip.active');
  return el ? el.dataset.val : '';
}

// ── Generate ──
async function generatePoem() {
  const words = document.getElementById('wordsInput').value.trim();
  if (!words) {
    showError('Zəhmət olmasa, şeir üçün söz və ya mövzu yazın.');
    return;
  }

  if (PROXY_URL === 'https://yellow-grass-baff.hsnhlm849.workers.dev/') {
    showError('Xəta: script.js faylında Worker URL-i yazılmayıb!');
    return;
  }

  const style = getActive('styleGroup');
  const length = getActive('lengthGroup');

  setLoading(true);
  hideError();
  hideResult();

  const prompt = `Sən Azərbaycan dilinin ən gözəl şair ustasısan. 
Aşağıdakı sözlər/mövzu əsasında Azərbaycanca ${style} üslubunda, ${length} həcmli, çox gözəl, hissli bir şeir yaz.

Sözlər/Mövzu: "${words}"

Cavabını YALNIZ JSON formatında ver, başqa heç nə yazma:
{
  "title": "Şeirin adı",
  "poem": "Şeirin tam mətni (bəndlər arasında boş sətir olsun)",
  "style": "üslub adı"
}

Şeir:
- Azərbaycan dilinin zənginliyini istifadə et
- Ahəng, qafiyə, ritm gözəl olsun
- Hissləri, obrazları canlı ifadə et
- ${style} üslubuna tam uyğun olsun`;

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`API xətası: ${response.status}`);
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');

    let parsed;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch {
      parsed = { title: 'Şeirim', poem: raw, style: style };
    }

    showResult(parsed.title, parsed.poem, parsed.style || style);
  } catch (err) {
    showError('Şeir yaradılarkən xəta baş verdi. Yenidən cəhd edin.');
    console.error(err);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  document.getElementById('loadingState').classList.toggle('visible', on);
  document.getElementById('btnGenerate').disabled = on;
}

function showResult(title, poem, style) {
  document.getElementById('poemTitle').textContent = title;
  document.getElementById('poemText').textContent = poem;
  document.getElementById('poemStyleTag').textContent = `✦ ${style}`;
  document.getElementById('resultSection').classList.add('visible');
  document.getElementById('divider').style.display = '';
  document.getElementById('btnCopy').classList.remove('copied');
  document.getElementById('btnCopy').textContent = 'Kopyala';
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult() {
  document.getElementById('resultSection').classList.remove('visible');
  document.getElementById('divider').style.display = 'none';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('visible');
}

function hideError() {
  document.getElementById('errorMsg').classList.remove('visible');
}

async function copyPoem() {
  const title = document.getElementById('poemTitle').textContent;
  const poem = document.getElementById('poemText').textContent;
  try {
    await navigator.clipboard.writeText(`${title}\n\n${poem}`);
    const btn = document.getElementById('btnCopy');
    btn.textContent = '✓ Kopyalandı';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Kopyala'; btn.classList.remove('copied'); }, 2500);
  } catch {}
}

// Ctrl+Enter ilə şeir yarat
document.getElementById('wordsInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) generatePoem();
});
