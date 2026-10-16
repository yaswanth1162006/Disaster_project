import React, { useState } from 'react';
import { EmergencyCategory, EmergencyReport } from '../types/disaster';
import { api } from '../services/api';
import {
  ShieldAlert,
  MapPin,
  Users,
  AlertCircle,
  HeartPulse,
  Baby,
  Phone,
  Mail,
  Camera,
  CheckCircle2,
  Copy,
  Clock,
  Compass,
  FileText,
  LifeBuoy,
  BookOpen,
  ArrowRight,
  Flame,
  Waves,
  Wind,
  Mountain,
  UserX,
  Apple,
} from 'lucide-react';

interface CitizenPortalProps {
  onOpenTrackModalWithId?: (id: string) => void;
  onEmergencySubmitted?: (report: EmergencyReport) => void;
}

const CATEGORIES: Array<{
  name: EmergencyCategory;
  icon: string;
  desc: string;
  badgeColor: string;
}> = [
  { name: 'Flood', icon: '🌊', desc: 'Rising water, submerged roads, trapped in building', badgeColor: 'border-blue-500 bg-blue-950/40 text-blue-300' },
  { name: 'Cyclone', icon: '🌀', desc: 'Severe gale winds, flying debris, collapsed roof', badgeColor: 'border-teal-500 bg-teal-950/40 text-teal-300' },
  { name: 'Earthquake', icon: '🏚️', desc: 'Structural collapse, aftershocks, trapped under rubble', badgeColor: 'border-amber-600 bg-amber-950/40 text-amber-300' },
  { name: 'Landslide', icon: '⛰️', desc: 'Mudflow, slope slip, buried road or houses', badgeColor: 'border-amber-700 bg-stone-900/40 text-amber-200' },
  { name: 'Fire', icon: '🔥', desc: 'Rapid spread, smoke inhalation, blocked exits', badgeColor: 'border-red-500 bg-red-950/40 text-red-300' },
  { name: 'Medical Emergency', icon: '🚑', desc: 'Critical injury, cardiac arrest, respiratory crisis', badgeColor: 'border-rose-500 bg-rose-950/40 text-rose-300' },
  { name: 'Trapped Person', icon: '🆘', desc: 'Confined space, jammed doors, rising water threat', badgeColor: 'border-purple-500 bg-purple-950/40 text-purple-300' },
  { name: 'Missing Person', icon: '🔍', desc: 'Separated family member, child or elder lost', badgeColor: 'border-indigo-500 bg-indigo-950/40 text-indigo-300' },
  { name: 'Food or Water Shortage', icon: '🍞', desc: 'Severe deprivation, contaminated drinking water', badgeColor: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
  { name: 'Other', icon: '⚠️', desc: 'Other hazardous disaster-related distress', badgeColor: 'border-slate-500 bg-slate-900/60 text-slate-300' },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onOpenTrackModalWithId,
  onEmergencySubmitted,
}) => {
  // Form State
  const [category, setCategory] = useState<EmergencyCategory>('Flood');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [immediateDanger, setImmediateDanger] = useState<boolean>(true);
  const [medicalRequired, setMedicalRequired] = useState<boolean>(false);
  const [vulnerablePeople, setVulnerablePeople] = useState<boolean>(false);
  const [vulnerableDetails, setVulnerableDetails] = useState('');

  // Optional Contact
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState<EmergencyReport | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Grab Current GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(5)));
        setLongitude(Number(pos.coords.longitude.toFixed(5)));
        setIsLocating(false);
        if (!address) {
          setAddress(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError('GPS permission denied or unavailable. You can enter your street address or landmark manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Emergency
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!description.trim() || description.trim().length < 5) {
      setSubmitError('Please provide a clear description of the situation (minimum 5 characters).');
      return;
    }

    if (!address.trim() && (latitude === null || longitude === null)) {
      setSubmitError('Please specify an address or share your GPS location so rescue teams can locate you.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitEmergency({
        category,
        description: description.trim(),
        address: address.trim(),
        latitude: latitude || 17.72,
        longitude: longitude || 83.31,
        people_affected: peopleAffected,
        immediate_danger: immediateDanger,
        medical_required: medicalRequired,
        vulnerable_people: vulnerablePeople,
        vulnerable_details: vulnerableDetails.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        image_url: imageUrl.trim() || undefined,
      });

      if (res.success && res.report) {
        setSubmittedReport(res.report);
        if (onEmergencySubmitted) {
          onEmergencySubmitted(res.report);
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-semibold mb-4 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            EMERGENCY RESPONSE CITIZEN HOTLINE (24/7)
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Need Immediate Disaster Help?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report your situation directly to the unified disaster authority. No account required.
            Your coordinates and emergency details will be immediately dispatched to rescue teams, ambulances, and relief units.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Request ID
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deterministic Triage Engine
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time Response Tracking
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* SUBMISSION CONFIRMATION BANNER */}
        {submittedReport ? (
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                    Emergency Report Saved in Central Database
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(submittedReport.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Help Request Received & Dispatched
                </h3>

                <p className="text-slate-300 text-sm mt-2">
                  Your incident has been recorded and evaluated by the command center. Keep your Request ID safe to monitor verified responder status and team arrival estimates.
                </p>

                {/* Request ID Display Box */}
                <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 font-mono">YOUR OFFICIAL REQUEST ID:</div>
                    <div className="text-2xl font-black text-amber-400 font-mono tracking-wider">
                      {submittedReport.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyId(submittedReport.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedId ? 'Copied!' : 'Copy Code'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenTrackModalWithId) {
                          onOpenTrackModalWithId(submittedReport.id);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-colors"
                    >
                      <span>Track Live Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Initial Triage Details */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Category</div>
                    <div className="font-semibold text-white mt-0.5">{submittedReport.category}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Priority Tier</div>
                    <div className="font-bold text-red-400 mt-0.5">{submittedReport.priority} ({submittedReport.priority_score} pts)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">People Affected</div>
                    <div className="font-semibold text-white mt-0.5">{submittedReport.people_affected} Individuals</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Initial Status</div>
                    <div className="font-semibold text-amber-400 mt-0.5">{submittedReport.status}</div>
                  </div>
                </div>

                {/* Reset Form Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setSubmittedReport(null);
                      setDescription('');
                      setAddress('');
                      setLatitude(null);
                      setLongitude(null);
                      setImmediateDanger(true);
                      setMedicalRequired(false);
                      setVulnerablePeople(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                  >
                    Submit another report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* REPORT EMERGENCY FORM */
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8"
          >
            {/* Step 1: Emergency Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  Select Disaster / Emergency Category
                </label>
                <span className="text-xs text-red-400 font-semibold">* Required</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between h-24 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{cat.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Location & GPS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  Where is help needed?
                </label>
                <span className="text-xs text-red-400 font-semibold">* Required</span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street name, landmark, building name, floor, or locality..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0 transition-colors"
                  >
                    <Compass className={`w-4 h-4 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS'}</span>
                  </button>
                </div>

                {latitude !== null && longitude !== null && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GPS Coordinates locked: {latitude}, {longitude}</span>
                  </div>
                )}

                {gpsError && (
                  <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                    {gpsError}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Description of Incident */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  Describe the emergency & immediate danger
                </label>
                <span className="text-xs text-red-400 font-semibold">* Required</span>
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Are people stranded on a roof? Trapped behind doors? Is water rising rapidly? Any known hazards like live electrical wires?"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Step 4: Scale, Vulnerability & Urgency Toggles */}
            <div>
              <label className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  4
                </span>
                Casualties & Critical Conditions
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Number of people */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" /> Number of People Affected
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{peopleAffected}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 person</span>
                    <span>20</span>
                    <span>50</span>
                    <span>100+</span>
                  </div>
                </div>

                {/* Immediate Danger Checkbox */}
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  immediateDanger
                    ? 'border-red-500/80 bg-red-950/40 text-red-200'
                    : 'border-slate-800 bg-slate-950/80 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={immediateDanger}
                    onChange={(e) => setImmediateDanger(e.target.checked)}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Immediate Threat to Life
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Check if life is in acute danger within minutes (e.g. rising water, smoke, severe trauma).
                    </div>
                  </div>
                </label>

                {/* Medical Required */}
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  medicalRequired
                    ? 'border-rose-500/80 bg-rose-950/40 text-rose-200'
                    : 'border-slate-800 bg-slate-950/80 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={medicalRequired}
                    onChange={(e) => setMedicalRequired(e.target.checked)}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Urgent Medical Care Required
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Paramedic ambulance triage, oxygen, burns, fractures, or critical prescriptions.
                    </div>
                  </div>
                </label>

                {/* Vulnerable Persons */}
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  vulnerablePeople
                    ? 'border-amber-500/80 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-950/80 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={vulnerablePeople}
                    onChange={(e) => setVulnerablePeople(e.target.checked)}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Baby className="w-3.5 h-3.5 text-amber-400" /> Vulnerable Persons Present
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Infants, pregnant women, elderly, wheelchair-bound or disabled persons.
                    </div>
                  </div>
                </label>
              </div>

              {vulnerablePeople && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={vulnerableDetails}
                    onChange={(e) => setVulnerableDetails(e.target.value)}
                    placeholder="Provide details (e.g. 1 baby under 6mo, 80yo needing wheelchair)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Step 5: Optional Contact & Photo */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Optional Contact & Photo (Helps Responders Locate You)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Your Name (Optional)</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 or local phone"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Photo URL / Attachment (Optional)</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Optional image link"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>
                  {isSubmitting ? 'Transmitting to Command Center...' : 'TRANSMIT EMERGENCY REPORT NOW'}
                </span>
              </button>
              <div className="text-center text-[11px] text-slate-500 mt-2">
                Emergency calls are logged with cryptographic timestamps in the public disaster registry.
              </div>
            </div>
          </form>
        )}

        {/* Emergency Safety Guides & Information */}
        <section className="mt-14 space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-base">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Immediate Life-Safety Protocols While Waiting for Rescue</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Waves className="w-4 h-4" /> Flood / Flash Water
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Move to the highest floor or roof. Never hide inside closed attics where water can trap you. Disconnect the main electrical breaker if safe. Signal rescue boats with bright cloth or phone flash.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Mountain className="w-4 h-4" /> Landslide / Mudflow
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Move rapidly away from the path of flow. If escape is blocked, curl into a tight ball and protect your head. Listen for unusual sounds like trees cracking or roaring boulders.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <Flame className="w-4 h-4" /> Fire & Dense Smoke
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stay low to the floor where air is cleaner. Place wet towels or clothing under doorways. Never use elevators. Test door handles with the back of your hand before opening.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-400">
                <Wind className="w-4 h-4" /> Cyclone / High Gale
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stay in the strongest central room away from windows and glass doors. Keep mattress handy for head protection. Store drinking water in closed clean vessels before mains cutoff.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
