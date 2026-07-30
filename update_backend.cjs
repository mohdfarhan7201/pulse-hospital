const fs = require('fs');

let db = fs.readFileSync('src/lib/server/db.ts', 'utf-8');

// Replace AppointmentRecord interface
db = db.replace('reason: string;', 'address: string;\n  state: string;\n  country: string;');

// Replace mapping in loadCacheFromMongo
db = db.replace('reason: a.reason,', 'address: a.address,\n        state: a.state,\n        country: a.country,');

// Replace seed data reasons
db = db.replace(/reason:\s*"([^"]+)",/g, 'address: "$1",\n      state: "Uttar Pradesh",\n      country: "India",');

fs.writeFileSync('src/lib/server/db.ts', db, 'utf-8');

let api = fs.readFileSync('src/lib/api.ts', 'utf-8');

// Update api.ts createPublicAppointmentFn param
api = api.replace('reason?: string;', 'address: string;\n      state: string;\n      country: string;');
api = api.replace('reason: data.reason?.trim() || "General Consultation",', 'address: data.address,\n      state: data.state,\n      country: data.country,');

fs.writeFileSync('src/lib/api.ts', api, 'utf-8');

console.log('Backend types updated successfully.');
