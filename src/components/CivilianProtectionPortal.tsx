import React, { useState } from 'react';
import {
  LifeBuoy,
  PhoneCall,
  Home,
  HeartPulse,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Languages,
  BookOpen,
  ArrowRight,
  Shield,
  Download,
  Share2,
} from 'lucide-react';
import { Shelter, FamilyCheckIn, MissingPersonReport } from '../types';

interface CivilianProtectionPortalProps {
  shelters: Shelter[];
  familyCheckIns: FamilyCheckIn[];
  missingPersons: MissingPersonReport[];
  onSubmitCheckIn: (data: Partial<FamilyCheckIn>) => Promise<void>;
  onSubmitMissingPerson: (data: Partial<MissingPersonReport>) => Promise<void>;
  onTriggerGuidance: (topic: string, language: string) => Promise<any>;
}

export const CivilianProtectionPortal: React.FC<CivilianProtectionPortalProps> = ({
  shelters,
  familyCheckIns,
  missingPersons,
  onSubmitCheckIn,
  onSubmitMissingPerson,
  onTriggerGuidance,
}) => {
  const [activeTab, setActiveTab] = useState<'shelters' | 'checkin' | 'missing' | 'firstaid' | 'hotlines'>('shelters');

  // Family check-in states
  const [personName, setPersonName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [status, setStatus] = useState<FamilyCheckIn['status']>('safe_at_shelter');
  const [zone, setZone] = useState('');
  const [checkInMsg, setCheckInMsg] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Missing person states
  const [missingName, setMissingName] = useState('');
  const [missingAge, setMissingAge] = useState('');
  const [missingZone, setMissingZone] = useState('');
  const [missingDetails, setMissingDetails] = useState('');
  const [missingRelationship, setMissingRelationship] = useState('');
  const [missingContact, setMissingContact] = useState('');
  const [missingSuccess, setMissingSuccess] = useState(false);

  // Guidance states
  const [selectedTopic, setSelectedTopic] = useState('first_aid_shrapnel');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [guidanceData, setGuidanceData] = useState<{
    title: string;
    steps: string[];
    offlineTip: string;
  } | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState(false);

  // Handle Family Check-In
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !familyCode) return;

    await onSubmitCheckIn({
      personName,
      familyCode,
      status,
      zone: zone || 'General Safe Perimeter',
      message: checkInMsg,
      isPublicContactAllowed: true,
    });

    setCheckInSuccess(true);
    setPersonName('');
    setCheckInMsg('');
    setTimeout(() => setCheckInSuccess(false), 5000);
  };

  // Handle Missing Person
  const handleMissingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingName || !missingZone) return;

    await onSubmitMissingPerson({
      fullName: missingName,
      age: Number(missingAge) || 0,
      lastSeenZone: missingZone,
      identifyingDetails: missingDetails,
      reportedByRelationship: missingRelationship,
      contactEmailOrPhone: missingContact,
    });

    setMissingSuccess(true);
    setMissingName('');
    setMissingDetails('');
    setTimeout(() => setMissingSuccess(false), 5000);
  };

  // Load Guidance
  const handleLoadGuidance = async () => {
    setLoadingGuidance(true);
    try {
      const data = await onTriggerGuidance(selectedTopic, selectedLanguage);
      if (data) {
        setGuidanceData(data);
      }
    } finally {
      setLoadingGuidance(false);
    }
  };

  const filteredCheckIns = searchCode.trim()
    ? familyCheckIns.filter((c) => c.familyCode.toUpperCase().includes(searchCode.toUpperCase().trim()))
    : familyCheckIns;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Civilian Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-900/80 border border-emerald-600/40 text-emerald-400">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Civilian Protection &amp; Family Welfare Mode
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Emergency Survival, Safe Shelters &amp; Family Reunification
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            All data submitted here is protected under humanitarian protocols. We never share civilian locations with combatants or unverified entities.
          </p>
        </div>

        {/* Quick Dial Emergency Card */}
        <div className="bg-slate-950/80 border border-emerald-700/50 p-4 rounded-xl shrink-0 space-y-2 text-xs">
          <span className="font-bold text-emerald-300 text-[11px] uppercase tracking-wider block">
            Immediate Emergency Hotlines
          </span>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Civil Defense:</span>
              <a href="tel:112" className="text-emerald-400 font-bold hover:underline">
                112 / 911
              </a>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Red Cross Ambulance:</span>
              <a href="tel:102" className="text-red-400 font-bold hover:underline">
                102
              </a>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Evacuation Dispatch:</span>
              <a href="tel:18005550192" className="text-blue-400 font-bold hover:underline">
                1-800-555-0192
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'shelters'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Safe Shelters Finder</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'checkin'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>"I Am Safe" Family Check-In</span>
        </button>

        <button
          onClick={() => setActiveTab('missing')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'missing'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Missing Persons Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('firstaid')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'firstaid'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HeartPulse className="h-4 w-4" />
          <span>Multilingual First Aid &amp; Guides</span>
        </button>

        <button
          onClick={() => setActiveTab('hotlines')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'hotlines'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>Emergency Hotlines</span>
        </button>
      </div>

      {/* Tab 1: Shelters */}
      {activeTab === 'shelters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified safe facilities operated by Civil Defense &amp; UNHCR partners</span>
            <span>{shelters.length} operational shelters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shelters.map((shl) => {
              const occupancyPct = Math.round((shl.currentOccupancy / shl.capacity) * 100);
              const isFull = occupancyPct >= 95;

              return (
                <div
                  key={shl.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3.5 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                        {shl.zone}
                      </span>
                      <h4 className="font-bold text-sm text-slate-100 mt-0.5">{shl.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{shl.address}</p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        isFull
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isFull ? 'Near Full' : 'Open & Accepting'}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>Shelter Capacity:</span>
                      <span className="font-mono">
                        {shl.currentOccupancy} / {shl.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Available Support:</span>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                      {shl.amenities.map((a, i) => (
                        <span key={i} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 capitalize">
                          {a.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Direct Shelter Desk:</span>
                    <a
                      href={`tel:${shl.contactPhone}`}
                      className="font-mono text-emerald-400 hover:underline font-bold"
                    >
                      {shl.contactPhone}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Family Check-In */}
      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit Check-In Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Register "I Am Safe" Status
            </h3>
            <p className="text-xs text-slate-400">
              Let your loved ones know where you are. Share your family code privately with family members so they can find you.
            </p>

            {checkInSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Your status has been posted to the registry.</span>
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Your Full Name &amp; Count</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima &amp; Yusuf (2)"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">
                  Private Family Search Code
                  <span className="text-slate-500 block text-[10px]">
                    Share this code with your family (e.g. KAREEM-2026)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ALMANSOOR-88"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Current Welfare Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="safe_at_shelter">Safe at Designated Shelter</option>
                  <option value="evacuating">In Transit / Evacuating</option>
                  <option value="sheltered_at_home">Sheltered at Home</option>
                  <option value="needs_medical_aid">Sheltered but Needs Medical Aid</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Current Location / Shelter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Al-Salam Shelter Hall B"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Short Message for Family</label>
                <textarea
                  rows={2}
                  placeholder="e.g. We have water and warmth. Omar, meet us here."
                  value={checkInMsg}
                  onChange={(e) => setCheckInMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
              >
                Post Safe Check-In
              </button>
            </form>
          </div>

          {/* Search Family Code & Board */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Enter your family code to find loved ones (e.g. MANSOOR-882)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 w-full focus:outline-none"
              />
              {searchCode && (
                <button onClick={() => setSearchCode('')} className="text-slate-400 hover:text-white text-xs">
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredCheckIns.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-xl text-center text-xs text-slate-400">
                  No check-ins found for code "{searchCode}". Double-check spelling or ask family to register above.
                </div>
              ) : (
                filteredCheckIns.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{item.personName}</span>
                        <span className="font-mono text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700">
                          CODE: {item.familyCode}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-medium capitalize">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <span>·</span>
                      <span className="text-slate-300">{item.zone}</span>
                    </div>

                    <p className="text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      "{item.message}"
                    </p>

                    {item.isPublicContactAllowed && item.contactNumber && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        Phone contact: <span className="font-mono text-slate-200">{item.contactNumber}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Missing Persons */}
      {activeTab === 'missing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" />
              Report a Missing Person
            </h3>
            <p className="text-xs text-slate-400">
              Submitted cases are cross-referenced with shelter intake registries and Red Cross tracing teams.
            </p>

            {missingSuccess && (
              <div className="p-3 bg-blue-950/80 border border-blue-700 rounded-lg text-blue-200 text-xs">
                Missing person report registered. Humanitarian field workers notified.
              </div>
            )}

            <form onSubmit={handleMissingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Missing Person's Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yusuf Kareem"
                  value={missingName}
                  onChange={(e) => setMissingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 11"
                    value={missingAge}
                    onChange={(e) => setMissingAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Your Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Mother"
                    value={missingRelationship}
                    onChange={(e) => setMissingRelationship(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Last Seen Zone / Sector</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Valley Market Square"
                  value={missingZone}
                  onChange={(e) => setMissingZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Identifying Clothing &amp; Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Red hoodie, green backpack, silver glasses..."
                  value={missingDetails}
                  onChange={(e) => setMissingDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Your Contact Phone / Email</label>
                <input
                  type="text"
                  placeholder="Where tracing officers can contact you"
                  value={missingContact}
                  onChange={(e) => setMissingContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
              >
                Submit Tracing Request
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Active Tracing Cases ({missingPersons.length})
            </h4>

            <div className="space-y-3">
              {missingPersons.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-2.5 text-xs shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-slate-100">
                        {p.fullName}, {p.age} years old
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Last seen: <strong className="text-slate-200">{p.lastSeenZone}</strong>
                      </span>
                    </div>

                    <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                    {p.identifyingDetails}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Reported by: {p.reportedByRelationship}</span>
                    <span>Assigned Tracing Officer: <strong className="text-slate-400">{p.caseOfficer || 'Red Cross Unit'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Multilingual First Aid & Guides */}
      {activeTab === 'firstaid' && (
        <div className="space-y-6">
          {/* Selector Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-slate-300">Topic:</span>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs"
                >
                  <option value="first_aid_shrapnel">Emergency Bleeding &amp; Shrapnel</option>
                  <option value="evacuation_checklist">Rapid Evacuation Readiness</option>
                  <option value="water_purification">Water Disinfection &amp; Rationing</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Languages className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-slate-300">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-mono"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="uk">Українська (Ukrainian)</option>
                  <option value="fr">Français (French)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="sw">Kiswahili (Swahili)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleLoadGuidance}
              disabled={loadingGuidance}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shrink-0"
            >
              <span>{loadingGuidance ? 'Generating with Gemini...' : 'Generate AI Emergency Card'}</span>
            </button>
          </div>

          {/* Guide Display Card */}
          {guidanceData ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100">{guidanceData.title}</h3>
                <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Offline-Ready Emergency Card
                </span>
              </div>

              <div className="space-y-3">
                {guidanceData.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-200">
                    <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>

              {guidanceData.offlineTip && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
                  <strong>Offline Life-Safety Tip:</strong> {guidanceData.offlineTip}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center space-y-2">
              <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Select your preferred topic and language above to generate accessible emergency survival protocols.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Hotlines */}
      {activeTab === 'hotlines' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">Medical Rescue</span>
            <h4 className="font-bold text-sm text-slate-100">Red Cross Emergency Dispatch</h4>
            <p className="text-slate-400 text-xs">Ambulance triage, shrapnel trauma response, blood donation bank.</p>
            <div className="pt-2">
              <a href="tel:102" className="text-emerald-400 font-bold font-mono text-sm hover:underline">
                Call: 102
              </a>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Civil Defense</span>
            <h4 className="font-bold text-sm text-slate-100">Evacuation Corridor Control</h4>
            <p className="text-slate-400 text-xs">Highway 12 patrol, vehicle escort, unexploded ordnance marking.</p>
            <div className="pt-2">
              <a href="tel:112" className="text-emerald-400 font-bold font-mono text-sm hover:underline">
                Call: 112
              </a>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold">Humanitarian Aid</span>
            <h4 className="font-bold text-sm text-slate-100">UNHCR Relief Coordinator</h4>
            <p className="text-slate-400 text-xs">Food basket allocation, infant formula, emergency winter blankets.</p>
            <div className="pt-2">
              <a href="tel:18005550192" className="text-emerald-400 font-bold font-mono text-sm hover:underline">
                Call: 1-800-555-0192
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
