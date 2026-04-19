const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1].trim();
  if (code.length > 0) {
    fs.writeFileSync(`test_script_${count}.js`, code);
    console.log(`Extracted script ${count}`);
    count++;
  }
}
