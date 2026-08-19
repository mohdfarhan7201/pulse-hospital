const fs = require('fs');

function disableMobileGSAP(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');
  
  // For index.tsx
  data = data.replace(/const ctx = gsap\.context\(\(\) => \{/g, `if (window.matchMedia("(max-width: 768px)").matches) return;\n      const ctx = gsap.context(() => {`);
  
  // For Reveal.tsx
  data = data.replace(/const el = ref\.current;\n\s*if \(\!el\) return;/g, `const el = ref.current;\n    if (!el) return;\n    if (window.matchMedia("(max-width: 768px)").matches) {\n      gsap.set(el, { clearProps: "all" });\n      return;\n    }`);
  
  fs.writeFileSync(filePath, data);
}

disableMobileGSAP('src/routes/index.tsx');
disableMobileGSAP('src/components/site/Reveal.tsx');
console.log('Mobile GSAP disabled successfully.');
