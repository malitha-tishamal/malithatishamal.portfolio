const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const label = process.argv.find(a => a.startsWith('--label='))?.split('=')[1] || 'baseline';
const outDir = path.join(process.cwd(), '.lighthouse-reports', label);
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'projects-list', url: 'http://localhost:3000/projects' },
  { name: 'portfolio-list', url: 'http://localhost:3000/portfolio' },
  { name: 'certifications-list', url: 'http://localhost:3000/certifications' },
  { name: 'blog-detail', url: 'http://localhost:3000/blog/mastering-full-stack-engineering-scalable-web-architecture-devops-cloud-solutions' },
];

const requestedPage = process.argv.find(a => a.startsWith('--page='))?.split('=')[1];
const targetPages = requestedPage ? pages.filter(p => p.name === requestedPage) : pages;

const presets = ['mobile', 'desktop'];
const requestedPreset = process.argv.find(a => a.startsWith('--preset='))?.split('=')[1];
const targetPresets = requestedPreset ? [requestedPreset] : presets;

console.log(`Starting Lighthouse runs for label [${label}]...`);

const results = [];

for (const page of targetPages) {
  for (const preset of targetPresets) {
    const isDesktop = preset === 'desktop';
    const filename = `${page.name}-${preset}.json`;
    const outputPath = path.join(outDir, filename);

    console.log(`\n▶ Running Lighthouse on [${page.name}] (${preset})...`);
    const flags = [
      `"${page.url}"`,
      `--output=json`,
      `--output-path="${outputPath}"`,
      `--chrome-flags="--headless=new --no-sandbox"`,
      `--quiet`,
      isDesktop ? `--preset=desktop` : '',
    ].filter(Boolean).join(' ');

    try {
      execSync(`npx lighthouse ${flags}`, { stdio: 'inherit', timeout: 120000 });
      const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      const cats = report.categories || {};
      const audits = report.audits || {};

      const row = {
        page: page.name,
        device: preset,
        perf: Math.round((cats.performance?.score || 0) * 100),
        a11y: Math.round((cats.accessibility?.score || 0) * 100),
        bp: Math.round((cats['best-practices']?.score || 0) * 100),
        seo: Math.round((cats.seo?.score || 0) * 100),
        fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
        lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
        tbt: audits['total-blocking-time']?.displayValue || 'N/A',
        cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
        topFailures: Object.entries(audits)
          .filter(([k, v]) => typeof v.score === 'number' && v.score < 0.9 && v.scoreDisplayMode !== 'notApplicable' && v.scoreDisplayMode !== 'informative')
          .slice(0, 5)
          .map(([k, v]) => `${k} (${v.displayValue || Math.round(v.score * 100) + '%'})`),
      };
      results.push(row);
      console.log(`  ✓ Done [${page.name} - ${preset}]: Perf: ${row.perf} | A11y: ${row.a11y} | BP: ${row.bp} | SEO: ${row.seo}`);
    } catch (err) {
      console.error(`  ✗ Error running Lighthouse on ${page.name} (${preset}):`, err.message);
    }
  }
}

// Write summary JSON
const summaryPath = path.join(outDir, 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

console.log('\n================== LIGHTHOUSE SUMMARY TABLE ==================');
console.table(results.map(r => ({
  Page: r.page,
  Device: r.device,
  Perf: r.perf,
  A11y: r.a11y,
  BP: r.bp,
  SEO: r.seo,
  FCP: r.fcp,
  LCP: r.lcp,
  TBT: r.tbt,
  CLS: r.cls,
})));

console.log('\n================== TOP FAILING AUDITS ==================');
results.forEach(r => {
  console.log(`[${r.page} - ${r.device}]:`);
  if (r.topFailures.length === 0) {
    console.log('  None! All audits >= 90%');
  } else {
    r.topFailures.forEach(f => console.log(`  - ${f}`));
  }
});
