const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf-8');

// 1. Remove selectedDoctor state
content = content.replace('  const [selectedDoctor, setSelectedDoctor] = useState<{img: string, n: string, r: string, exp: string, bio: string} | null>(null);\n', '');

// 2. Remove onClick and cursor-pointer from article
content = content.replace(/<article[\s\S]*?className="group relative aspect-\[3\/4\] w-full overflow-hidden rounded-\[2\.5rem\] border border-border bg-black shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-\[oklch\(0\.42_0\.18_265\)\]\/20 cursor-pointer"\s*>/, 
'<article className="group relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] border border-border bg-black shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[oklch(0.42_0.18_265)]/20">');

// 3. Remove View full profile button
content = content.replace(/<div className="grid grid-rows-\[0fr\] opacity-0 transition-all duration-500 group-hover:mt-5 group-hover:grid-rows-\[1fr\] group-hover:opacity-100">[\s\S]*?<\/div>\s*<\/div>/, '</div>');

// 4. Remove Dialog completely
content = content.replace(/<Dialog open=\{!!selectedDoctor\} onOpenChange=\{\(open\) => !open && setSelectedDoctor\(null\)\}>[\s\S]*?<\/Dialog>/, '');

fs.writeFileSync('src/routes/index.tsx', content, 'utf-8');
console.log('index.tsx doctors section updated');
