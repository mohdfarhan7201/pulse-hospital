const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf-8');

content = content.replace('onClick={() => setSelectedDoctor(d)}\n                className="group relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] border border-border bg-black shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[oklch(0.42_0.18_265)]/20 cursor-pointer"',
'className="group relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] border border-border bg-black shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[oklch(0.42_0.18_265)]/20"');

content = content.replace('<div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-hover:mt-5 group-hover:grid-rows-[1fr] group-hover:opacity-100">\n                    <div className="overflow-hidden">\n                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/30">\n                        View full profile <ArrowRight className="h-4 w-4" />\n                      </span>\n                    </div>\n                  </div>', '');

fs.writeFileSync('src/routes/index.tsx', content, 'utf-8');
console.log('done');
