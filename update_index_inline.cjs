const fs = require('fs');

let content = fs.readFileSync('src/routes/index.tsx', 'utf-8');

const indianStates = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const stateOptions = indianStates.map(s => `<option value="${s}">${s}</option>`).join('\n                    ');

// Replace "notes" logic with address, state, country, type
content = content.replace('const notes = (formData.get("notes") as string) || "General Consultation";', 
  'const address = (formData.get("address") as string) || "";\n    const state = (formData.get("state") as string) || "Uttar Pradesh";\n    const country = (formData.get("country") as string) || "India";\n    const type = (formData.get("type") as string) || "normal";');

content = content.replace('reason: notes,', 'address,\n          state,\n          country,\n          type,');


const newFieldsHTML = `
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Type</label>
                  <select
                    name="type"
                    required
                    defaultValue="normal"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="normal">Normal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">State</label>
                  <select
                    name="state"
                    required
                    defaultValue="Uttar Pradesh"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    ${stateOptions}
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Country</label>
                  <select
                    name="country"
                    required
                    defaultValue="India"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="India">India</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Address</label>
                  <textarea name="address" rows={2} required placeholder="Full Address..." className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring" />
                </div>
`;


content = content.replace(/<div className="sm:col-span-2">\s*<label className="mb-2 block text-xs uppercase tracking-\[0\.22em\] text-muted-foreground">Notes \/ Symptoms<\/label>\s*<textarea name="notes" rows=\{3\} placeholder="Briefly describe your health condition or symptoms…" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring" \/>\s*<\/div>/, newFieldsHTML);


fs.writeFileSync('src/routes/index.tsx', content, 'utf-8');
console.log('index.tsx inline form updated');
