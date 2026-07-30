const fs = require('fs');

let content = fs.readFileSync('src/routes/index.tsx', 'utf-8');

const oldForm = `            <form className="relative z-10 mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Phone Number</label>
                <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground/80">Department / Concern</label>
                <select className="w-full appearance-none rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20">
                  <option>General Consultation</option>
                  <option>Cardiac Surgery</option>
                  <option>Angioplasty / Cath Lab</option>
                  <option>Emergency</option>
                </select>
              </div>
              <button className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[oklch(0.4_0.18_265)] to-[oklch(0.62_0.15_210)] px-8 py-5 text-lg font-semibold text-white shadow-lg shadow-[oklch(0.62_0.15_210)]/25 transition-all hover:scale-[1.02] hover:shadow-[oklch(0.62_0.15_210)]/40 active:scale-95 sm:col-span-2">
                Submit Request
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>`;

const newForm = `            <form className="relative z-10 mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') || '';
              const phone = formData.get('phone') || '';
              const message = formData.get('message') || '';
              const cleanPhone = helplinePhone.replace(/\\s+/g, '');
              const text = encodeURIComponent(\`Hello! I would like to request a callback.\\n\\n*Name:* \${name}\\n*Phone:* \${phone}\\n*Message:* \${message}\`);
              window.open(\`https://wa.me/\${cleanPhone}?text=\${text}\`, '_blank');
              e.currentTarget.reset();
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Full Name</label>
                <input name="name" required type="text" placeholder="John Doe" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Phone Number</label>
                <input name="phone" required type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground/80">Message</label>
                <textarea name="message" required rows={3} placeholder="Please describe your concern here..." className="w-full appearance-none rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20"></textarea>
              </div>
              <button className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[oklch(0.4_0.18_265)] to-[oklch(0.62_0.15_210)] px-8 py-5 text-lg font-semibold text-white shadow-lg shadow-[oklch(0.62_0.15_210)]/25 transition-all hover:scale-[1.02] hover:shadow-[oklch(0.62_0.15_210)]/40 active:scale-95 sm:col-span-2">
                Submit Request
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>`;

content = content.replace(oldForm, newForm);

fs.writeFileSync('src/routes/index.tsx', content, 'utf-8');
console.log('index.tsx callback form updated');
