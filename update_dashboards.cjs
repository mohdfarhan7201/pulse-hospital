const fs = require('fs');

let adminFile = fs.readFileSync('src/routes/admin/appointments.tsx', 'utf-8');

adminFile = adminFile.replace('<TableHead>Reason</TableHead>', '<TableHead>Location / Address</TableHead>');
adminFile = adminFile.replace('<TableCell className="text-muted-foreground">{a.reason}</TableCell>', 
  '<TableCell className="text-muted-foreground"><div className="truncate max-w-[200px]" title={`${a.address}, ${a.state}, ${a.country}`}>{a.address}, {a.state}, {a.country}</div></TableCell>');
adminFile = adminFile.replace('placeholder="Search by patient, doctor, department or reason…"', 'placeholder="Search by patient, doctor, department or address…"');
adminFile = adminFile.replace('a.reason.toLowerCase().includes(q)', 'a.address.toLowerCase().includes(q) || a.state.toLowerCase().includes(q)');

fs.writeFileSync('src/routes/admin/appointments.tsx', adminFile, 'utf-8');
console.log('admin appointments updated');


let doctorFile = fs.readFileSync('src/routes/doctor/appointments.tsx', 'utf-8');

doctorFile = doctorFile.replace('a.reason.toLowerCase().includes(q)', 'a.address.toLowerCase().includes(q) || a.state.toLowerCase().includes(q)');
doctorFile = doctorFile.replace('placeholder="Search by patient, department or reason…"', 'placeholder="Search by patient, department or address…"');
doctorFile = doctorFile.replace('<div className="mt-4 rounded-lg bg-muted/40 p-3">\n                  <p className="text-xs text-muted-foreground mb-1">Reason for visit:</p>\n                  <p className="text-sm">{a.reason || "General Consultation"}</p>\n                </div>',
  '<div className="mt-4 rounded-lg bg-muted/40 p-3">\n                  <p className="text-xs text-muted-foreground mb-1">Address / Location:</p>\n                  <p className="text-sm">{a.address || "N/A"}</p>\n                  <p className="text-xs text-muted-foreground">{a.state}, {a.country}</p>\n                </div>');

fs.writeFileSync('src/routes/doctor/appointments.tsx', doctorFile, 'utf-8');
console.log('doctor appointments updated');
