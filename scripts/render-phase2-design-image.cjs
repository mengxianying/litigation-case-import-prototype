const fs = require('fs');
const path = require('path');
const { marked } = require('/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/marked');
const { chromium } = require('/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const source = path.resolve(__dirname, '../docs/superpowers/specs/2026-07-19-case-import-phase2-design.md');
const output = path.resolve(__dirname, '../docs/superpowers/specs/案件导入二期设计说明.png');
const tempHtml = path.resolve(__dirname, '../docs/superpowers/specs/.案件导入二期设计说明.preview.html');

const renderer = new marked.Renderer();
renderer.code = ({ text: code, lang: language }) => {
  if (language === 'mermaid') {
    const nodes = [...code.matchAll(/\b([A-Z])\[([^\]]+)\]/g)].map((match) => match[2].replace(/\\n/g, '<br>'));
    return `<div class="flow-title">一期历史批次补材流程</div><div class="flow">${nodes.map((node, index) => `<div class="flow-step">${node}</div>${index < nodes.length - 1 ? '<div class="flow-arrow">&#8594;</div>' : ''}`).join('')}</div>`;
  }
  return `<pre><code>${String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
};

marked.setOptions({ renderer, gfm: true, breaks: true });
const body = marked.parse(fs.readFileSync(source, 'utf8'));
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>案件导入二期设计说明</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#eef2f6;color:#243142;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.7} main{width:1440px;margin:0 auto;background:#fff;padding:58px 72px 80px} h1{margin:0 0 30px;padding:0 0 22px;color:#173a62;font-size:34px;line-height:1.25;border-bottom:4px solid #2d87db} h2{margin:48px 0 20px;padding:10px 16px;background:#edf6ff;border-left:5px solid #2d87db;color:#173a62;font-size:24px;line-height:1.35} h3{margin:34px 0 14px;color:#265b8d;font-size:19px;line-height:1.4} h4{margin:24px 0 9px;color:#384b5f;font-size:17px} p{margin:10px 0} strong{color:#1d5d98} hr{margin:30px 0;border:0;border-top:1px solid #dce4ed} ul,ol{margin:10px 0 10px 28px;padding-left:15px} li{padding:3px 0} table{width:100%;margin:14px 0 28px;border-collapse:collapse;table-layout:auto;font-size:14px;line-height:1.55} th,td{padding:10px 12px;vertical-align:top;text-align:left;border:1px solid #d9e2ec;word-break:break-word} th{background:#eff6fc;color:#284e72;font-weight:600} tr:nth-child(even) td{background:#fafcff} code{padding:2px 5px;border-radius:3px;background:#f2f5f8;color:#b34c32;font-family:"SFMono-Regular",Consolas,monospace;font-size:.9em} pre{padding:14px;background:#f7f9fb;border:1px solid #dde6ee;overflow:auto} .flow-title{margin:22px 0 10px;color:#265b8d;font-size:17px;font-weight:600}.flow{display:flex;align-items:stretch;gap:10px;margin:10px 0 28px;padding:20px;background:#f7fbff;border:1px solid #cfe2f4}.flow-step{display:flex;align-items:center;justify-content:center;flex:1;min-height:74px;padding:10px;border:1px solid #afd2f2;background:#fff;color:#204f7b;font-size:14px;font-weight:600;line-height:1.5;text-align:center}.flow-arrow{display:flex;align-items:center;color:#2d87db;font-size:24px;font-weight:700}@media print{body{background:#fff}main{margin:0}}
</style></head><body><main>${body}</main></body></html>`;

async function render() {
  fs.writeFileSync(tempHtml, html);
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`file://${tempHtml}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
  fs.unlinkSync(tempHtml);
  console.log(output);
}

render().catch((error) => { console.error(error); process.exitCode = 1; });
