import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const blocks = [
  { 
    name: 'creamCatWidget', 
    file: 'src/widgets/creamcat.js',
    start: "          Alpine.data('creamCatWidget', function(item) {",
    next: "          Alpine.data('notebookWidget'"
  },
  { 
    name: 'notebookWidget', 
    file: 'src/widgets/notebook.js',
    start: "          Alpine.data('notebookWidget', function() {",
    next: "          Alpine.data('rongRongWidget'"
  },
  { 
    name: 'rongRongWidget', 
    file: 'src/widgets/rongrong.js',
    start: "          Alpine.data('rongRongWidget', function(initialItem) {",
    next: "          Alpine.data('vinylPlayerWidget'"
  },
  { 
    name: 'vinylPlayerWidget', 
    file: 'src/widgets/vinylplayer.js',
    start: "          Alpine.data('vinylPlayerWidget', function(item) {",
    next: "          Alpine.data('listenTogetherPlayer'"
  },
  { 
    name: 'listenTogetherPlayer', 
    file: 'src/widgets/listentogether.js',
    start: "          Alpine.data('listenTogetherPlayer', function() {",
    next: "          Alpine.data('iosDesktop'"
  }
];

let injectedScripts = [];

fs.mkdirSync('src/widgets', { recursive: true });

for (const b of blocks) {
    const sIdx = html.indexOf(b.start);
    const eIdx = html.indexOf(b.next);
    
    if (sIdx !== -1 && eIdx !== -1 && sIdx < eIdx) {
        let content = html.substring(sIdx, eIdx);
        
        const jsCode = "document.addEventListener('alpine:init', () => {\n" + 
            content.replace(/\s+$/, '') + "\n" +
            "});\n";
            
        fs.writeFileSync(b.file, jsCode);
        
        html = html.replace(content, '');
        
        injectedScripts.push(`<script src="/${b.file}"></script>`);
    } else {
        console.log(`Failed to find bounds for ${b.name}`);
    }
}

if (!html.includes('src="/src/widgets/creamcat.js"')) {
    html = html.replace('</head>', `    ${injectedScripts.join('\n    ')}\n</head>`);
}

fs.writeFileSync('index.html', html);
console.log('Widgets extracted.');
