import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { CursorGlow } from "@/components/site/CursorGlow";
import { Footer } from "@/components/site/Footer";
import { AppointmentModal } from "@/components/site/AppointmentModal";
import { Stethoscope, HeartPulse, Activity } from "lucide-react";

export const Route = createFileRoute("/specialties/$slug")({
  component: SpecialtyPage,
});

const specialtiesData: Record<string, any> = {
  "interventional-cardiology": {
    title: "Interventional Cardiology",
    description: "Minimally invasive procedures to diagnose and treat heart and blood vessel conditions without traditional open surgery. We use the latest catheter-based techniques for faster recovery.",
    treatments: [
      { name: "Angioplasty & Stenting", desc: "Opening narrowed or blocked blood vessels that supply blood to the heart." },
      { name: "Cardiac Catheterization", desc: "Diagnostic procedure to evaluate heart function and detect blockages." },
      { name: "TAVR/TAVI", desc: "Transcatheter Aortic Valve Replacement for severe aortic stenosis." },
      { name: "MitraClip", desc: "Minimally invasive treatment for patients with mitral regurgitation." }
    ],
    expertise: "Our interventional cardiologists are pioneers in complex coronary interventions, performing hundreds of successful procedures annually with success rates exceeding national averages."
  },
  "cardiac-surgery": {
    title: "Cardiac Surgery",
    description: "World-class surgical care for the most complex heart conditions. Our surgical team specializes in both traditional open-heart surgeries and advanced minimally invasive procedures.",
    treatments: [
      { name: "Coronary Bypass (CABG)", desc: "Creating new routes around narrowed and blocked coronary arteries." },
      { name: "Valve Repair & Replacement", desc: "Surgical intervention for diseased or damaged heart valves." },
      { name: "Aortic Surgery", desc: "Complex repairs of aortic aneurysms and dissections." },
      { name: "Heart Failure Surgery", desc: "Implantation of ventricular assist devices (VADs) and other surgical options." }
    ],
    expertise: "We feature state-of-the-art surgical suites and a dedicated cardiac intensive care unit, ensuring you receive the highest level of care before, during, and after your procedure."
  },
  "electrophysiology": {
    title: "Electrophysiology",
    description: "Advanced diagnosis and treatment of heart rhythm disorders (arrhythmias). We help restore your heart's normal rhythm using cutting-edge technology and mapping systems.",
    treatments: [
      { name: "Catheter Ablation", desc: "Targeting and destroying areas of heart tissue that cause abnormal rhythms." },
      { name: "Pacemaker Implantation", desc: "Devices to help control slow or irregular heartbeats." },
      { name: "ICD Implantation", desc: "Implantable cardioverter-defibrillators to prevent sudden cardiac arrest." },
      { name: "Holter & Event Monitoring", desc: "Continuous monitoring to detect transient arrhythmias over time." }
    ],
    expertise: "Our EP labs are equipped with 3D advanced mapping systems, allowing our specialists to pinpoint the exact origin of arrhythmias with millimeter precision."
  },
  "pediatric-cardiology": {
    title: "Pediatric Cardiology",
    description: "Compassionate, specialized care for infants, children, and adolescents with congenital and acquired heart conditions.",
    treatments: [
      { name: "Fetal Echocardiography", desc: "Early detection of heart defects before birth." },
      { name: "Congenital Defect Repair", desc: "Advanced surgical and catheter-based treatments." },
      { name: "Arrhythmia Management", desc: "Diagnosis and treatment of rhythm disorders in children." },
      { name: "Preventive Cardiology", desc: "Managing risk factors for cardiovascular disease in youth." }
    ],
    expertise: "We provide a family-centered approach, ensuring that both the child and parents are supported throughout the diagnosis and treatment process in a comforting environment."
  },
  "rehabilitation": {
    title: "Cardiac Rehabilitation",
    description: "A medically supervised program designed to improve your cardiovascular health after a heart attack, heart failure, angioplasty, or heart surgery.",
    treatments: [
      { name: "Monitored Exercise", desc: "Tailored physical activity to safely strengthen your heart." },
      { name: "Nutritional Counseling", desc: "Dietary plans to manage weight, cholesterol, and blood pressure." },
      { name: "Recovery Support", desc: "Psychological and emotional support during the recovery journey." },
      { name: "Lifestyle Modification", desc: "Education on nutrition, weight management, and stress reduction." }
    ],
    expertise: "Our rehabilitation specialists work with you one-on-one to create a tailored program that ensures a safe and effective return to your optimal health."
  },
  "diagnostic-cardiology": {
    title: "Diagnostic Cardiology",
    description: "State-of-the-art non-invasive testing to accurately diagnose heart conditions, allowing us to create effective, personalized treatment plans.",
    treatments: [
      { name: "Echocardiogram (Echo)", desc: "Ultrasound of the heart to evaluate structure and function." },
      { name: "Electrocardiogram (ECG)", desc: "Recording the electrical activity of the heart." },
      { name: "Stress Testing (TMT)", desc: "Evaluating heart function during physical exertion." },
      { name: "Holter Monitoring", desc: "24-48 hour continuous heart rhythm recording." }
    ],
    expertise: "Our diagnostic labs use the latest imaging technology and are staffed by highly trained sonographers and cardiologists for unparalleled accuracy."
  },
  "emergency-and-trauma": {
    title: "Emergency & Trauma",
    description: "Rapid-response cardiac emergency care available 24/7. We specialize in immediate interventions for acute heart attacks and other critical conditions.",
    treatments: [
      { name: "Primary Angioplasty", desc: "Immediate catheter-based treatment for acute myocardial infarction." },
      { name: "Resuscitation & Defibrillation", desc: "Advanced life support and rhythm restoration." },
      { name: "Emergency Pacing", desc: "Temporary pacemaker insertion for severe bradycardia." },
      { name: "Trauma Surgery", desc: "Surgical intervention for chest trauma affecting the heart." }
    ],
    expertise: "With a door-to-balloon time well below the national standard of 60 minutes, our emergency team is always ready to save lives when every second counts."
  },
  "preventive-cardiology": {
    title: "Preventive Cardiology",
    description: "Comprehensive risk assessment and lifestyle management programs designed to prevent cardiovascular disease before it starts.",
    treatments: [
      { name: "Cardiac Wellness Checkup", desc: "Complete screening for cardiovascular risk factors." },
      { name: "Lipid Management", desc: "Specialized clinics for managing complex cholesterol disorders." },
      { name: "Hypertension Clinic", desc: "Targeted approaches for difficult-to-control high blood pressure." },
      { name: "Nutritional Counseling", desc: "Personalized diet plans to optimize heart health." }
    ],
    expertise: "Our preventive team combines advanced genetic screening, detailed metabolic profiling, and personalized coaching to help you achieve a heart-healthy life."
  }
};

function SpecialtyPage() {
  const { slug } = Route.useParams();
  
  // Basic formatting from slug for fallback
  const fallbackTitle = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  
  const data = specialtiesData[slug] || {
    title: fallbackTitle,
    description: `Comprehensive care and advanced treatments in ${fallbackTitle}. Our expert team is dedicated to providing world-class medical services tailored to your unique needs.`,
    treatments: [
      { name: "Expert Consultations", desc: `Discuss your concerns with our leading specialists.` },
      { name: "Advanced Diagnostics", desc: "State-of-the-art facilities for precise and timely diagnosis." },
      { name: "Personalized Care", desc: "Tailored treatment plans designed specifically for you." },
      { name: "Ongoing Monitoring", desc: "Continuous support and care for your condition." }
    ],
    expertise: "We bring together a world-class team of specialists and state-of-the-art technology to provide the highest standard of care."
  };

  return (
    <main className="relative min-h-screen bg-[oklch(0.04_0.01_265)] font-sans text-white selection:bg-[oklch(0.62_0.15_210)] selection:text-white pb-32">
      <CursorGlow />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 h-[1000px] w-[1000px] rounded-full bg-[oklch(0.62_0.15_210)]/15 blur-[120px]" />
          <div className="absolute top-0 -left-1/4 h-[800px] w-[800px] rounded-full bg-[oklch(0.55_0.22_20)]/10 blur-[100px]" />
        </div>

        <div className="container relative mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[oklch(0.62_0.15_210)] uppercase tracking-widest backdrop-blur-sm">
                <HeartPulse className="h-4 w-4 animate-pulse" /> Department of Excellence
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-tight">
                {data.title}
              </h1>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
                {data.description}
              </p>
              <div className="pt-4">
                <AppointmentModal>
                  <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-[oklch(0.62_0.15_210)] px-8 font-medium text-white transition-all hover:scale-105 hover:shadow-[0_10px_40px_oklch(0.62_0.15_210_/_0.4)]">
                    <span className="relative z-10 flex items-center gap-2">
                      Book Consultation <Stethoscope className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
                  </button>
                </AppointmentModal>
              </div>
            </div>
            
            <div className="relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl shadow-[oklch(0.62_0.15_210)]/20 relative border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.62_0.15_210)]/80 to-[oklch(0.55_0.22_20)]/80 mix-blend-multiply z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2000&auto=format&fit=crop" 
                  alt={data.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <Activity className="h-32 w-32 text-white/40" strokeWidth={1} />
                </div>
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-8 -left-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-black/50 border border-white/10 flex items-center gap-4 z-30">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">Expert</div>
                  <div className="text-sm font-medium text-white/60 uppercase tracking-wider">Care Team</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="relative py-24 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Key Treatments & Procedures</h2>
            <p className="text-white/60 text-lg">We offer a comprehensive range of advanced treatments tailored to provide the best possible outcomes for our patients.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.treatments.map((treatment: any, idx: number) => (
              <div key={idx} className="group p-8 rounded-3xl bg-black/20 border border-white/5 hover:border-[oklch(0.62_0.15_210)]/50 hover:bg-white/5 hover:shadow-xl hover:shadow-[oklch(0.62_0.15_210)]/10 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <HeartPulse className="h-24 w-24 text-[oklch(0.62_0.15_210)] -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-[oklch(0.62_0.15_210)] group-hover:text-white transition-all duration-300">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{treatment.name}</h3>
                  <p className="text-white/60 leading-relaxed">{treatment.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/5 shadow-lg shadow-black/50 border border-white/10 mb-8 relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-[oklch(0.62_0.15_210)]/40" />
            <Stethoscope className="h-8 w-8 text-[oklch(0.62_0.15_210)] relative z-10" />
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8">Why Choose Our {data.title} Team?</h2>
          <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-light">
            "{data.expertise}"
          </p>
        </div>
      </section>

      <div className="relative z-20">
        <Footer />
      </div>
    </main>
  );
}
