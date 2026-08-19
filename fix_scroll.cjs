const fs = require('fs');
const file = 'src/routes/index.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/toggleActions:\s*"play reverse play reverse"/g, 'once: true');
data = data.replace(/start:\s*"top 80%"/g, 'start: "top 95%"');
data = data.replace(/start:\s*"top 85%"/g, 'start: "top 95%"');
data = data.replace(/start:\s*"top 90%"/g, 'start: "top 95%"');
fs.writeFileSync(file, data);
console.log('Fixed scroll animations in index.tsx');
