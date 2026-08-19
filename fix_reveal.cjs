const fs = require('fs');
const file = 'src/components/site/Reveal.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/start:\s*"top 85%"/g, 'start: "top 95%"');
fs.writeFileSync(file, data);
console.log('Fixed scroll animations in Reveal.tsx');
