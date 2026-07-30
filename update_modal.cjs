const fs = require('fs');

let content = fs.readFileSync('src/components/site/AppointmentModal.tsx', 'utf-8');

const indianStates = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const stateOptions = indianStates.map(s => `<option value="${s}">${s}</option>`).join('\n                    ');

content = content.replace('name="address"\n                    required\n                    rows={1}\n                    placeholder="Brief description of symptoms or consultation reason…"',
`name="address"\n                    required\n                    rows={2}\n                    placeholder="Full Address..."`);

content = content.replace('Address / Medical Notes', 'Address');

const newFields = `
                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    State
                  </label>
                  <select
                    name="state"
                    required
                    defaultValue="Uttar Pradesh"
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    ${stateOptions}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Country
                  </label>
                  <select
                    name="country"
                    required
                    defaultValue="India"
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    <option value="India">India</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
`;

// Insert the new fields right before the Address field
content = content.replace(/<div className="col-span-2">\s*<label className="mb-1 block text-\[9px\] font-bold uppercase tracking-\[0\.2em\] text-muted-foreground\">\s*Address/, 
  newFields + '<div className="col-span-2">\n                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">\n                    Address');

// Update handleSubmit to extract state and country
content = content.replace('const address = (formData.get("address") as string) || "";', 
  'const address = (formData.get("address") as string) || "";\n    const state = (formData.get("state") as string) || "Uttar Pradesh";\n    const country = (formData.get("country") as string) || "India";');

// Pass state and country to createPublicAppointmentFn
content = content.replace('address,\n          type: appointmentType,', 'address,\n          state,\n          country,\n          type: appointmentType,');

fs.writeFileSync('src/components/site/AppointmentModal.tsx', content, 'utf-8');
console.log('AppointmentModal.tsx updated');
