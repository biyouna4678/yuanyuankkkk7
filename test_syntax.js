const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
if (scriptMatch) {
    const js = scriptMatch[1];
    try {
        new Function(js);
        console.log("No syntax errors in main <script>!");
    } catch (e) {
        console.error("Syntax Error:", e);
    }
}
