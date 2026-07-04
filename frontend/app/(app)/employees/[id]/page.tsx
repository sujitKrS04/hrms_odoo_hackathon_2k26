'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthContext';
import { PageHeader, Card, FormField } from '../../../components/Primitives';
import { apiRequest, ResponseError } from '../../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  User as UserIcon,
  Shield,
  CreditCard,
  Plus,
  Check,
  Edit2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const targetId = params.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary'>('resume');

  // Edit states
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile Form States
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Skills & Certs Local Mocks (since no backend write endpoints exist)
  const [skills, setSkills] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('intermediate');
  const [showSkillForm, setShowSkillForm] = useState(false);

  const [newCertName, setNewCertName] = useState('');
  const [newCertOrg, setNewCertOrg] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [showCertForm, setShowCertForm] = useState(false);

  // Salary Form States (Admin/HR edit)
  const [editSalaryMode, setEditSalaryMode] = useState(false);
  const [salarySaving, setSalarySaving] = useState(false);
  const [salarySavedMsg, setSalarySavedMsg] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    ctc: 0,
    effectiveFrom: '',
    basicPct: 40,
    hraPct: 40,
    conveyanceFixed: 1600,
    medicalFixed: 1250,
    pfPct: 12,
    professionalTax: 200,
    incomeTax: 0,
  });

  const isSelf = currentUser?.id === targetId;

  // Permissions checks
  const canViewSalary =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'hr' ||
    isSelf;

  const canEditSalary =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'hr' && employee?.role === 'employee');

  const canEditAllProfileFields =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'hr' && employee?.role === 'employee');

  const fetchProfileAndSalary = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch employee profile
      const profileData = await apiRequest(`/employees/${targetId}/profile`);
      setEmployee(profileData);
      setSkills(profileData.skills || []);
      setCerts(profileData.certifications || []);

      // Populate profile form values
      setPhone(profileData.phone || '');
      setAddress(profileData.profile?.address || '');
      setCity(profileData.profile?.city || '');
      setStateName(profileData.profile?.state || '');
      setPincode(profileData.profile?.pincode || '');
      setNationality(profileData.profile?.nationality || 'Indian');
      setMaritalStatus(profileData.profile?.maritalStatus || 'single');
      setGender(profileData.profile?.gender || 'male');
      setEmergencyContactName(profileData.profile?.emergencyContactName || '');
      setEmergencyContactPhone(profileData.profile?.emergencyContactPhone || '');
      if (profileData.profile?.dateOfBirth) {
        setDateOfBirth(new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0]);
      } else {
        setDateOfBirth('');
      }

      // 2. Fetch salary details if authorized
      if (currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.id === targetId) {
        try {
          const salaryData = await apiRequest(`/payroll/${targetId}`);
          setPayroll(salaryData);

          // Populate salary form
          setSalaryForm({
            ctc: salaryData.annualCTC || 0,
            effectiveFrom: salaryData.structure?.effectiveFrom
              ? new Date(salaryData.structure.effectiveFrom).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            basicPct: 40,
            hraPct: 40,
            conveyanceFixed: 1600,
            medicalFixed: 1250,
            pfPct: 12,
            professionalTax: 200,
            incomeTax: salaryData.components?.find((c: any) => c.name === 'income_tax')?.amount
              ? Number(salaryData.components.find((c: any) => c.name === 'income_tax').amount)
              : 0,
          });
        } catch (salErr) {
          console.log('No payroll structure seeded or configured for this user yet.');
        }
      }
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setErrorMsg(err.errorData.message);
      } else {
        setErrorMsg('Failed to load profile. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && targetId) {
      fetchProfileAndSalary();
    }
  }, [currentUser, targetId]);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);

    try {
      const updatePayload: any = isSelf && !canEditAllProfileFields
        ? {
            phone,
            address,
            city,
            pincode,
            avatarUrl: employee.profile?.avatarUrl || '',
          }
        : {
            phone,
            address,
            city,
            state: stateName,
            pincode,
            nationality,
            maritalStatus,
            gender,
            emergencyContactName,
            emergencyContactPhone,
            dateOfBirth: dateOfBirth || undefined,
            avatarUrl: employee.profile?.avatarUrl || '',
          };

      const res = await apiRequest(`/employees/${targetId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      });

      setEmployee((prev: any) => ({ ...prev, ...res.data }));
      setEditProfileMode(false);
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Verify inputs match rules.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Add Skill local mock
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill = {
      id: `local-skill-${Date.now()}`,
      name: newSkillName.trim(),
      proficiency: newSkillProf,
    };

    setSkills([...skills, newSkill]);
    setNewSkillName('');
    setShowSkillForm(false);
  };

  // Add Cert local mock
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertName.trim() || !newCertOrg.trim()) return;

    const newCert = {
      id: `local-cert-${Date.now()}`,
      name: newCertName.trim(),
      issuingOrg: newCertOrg.trim(),
      issueDate: newCertDate || new Date().toISOString(),
    };

    setCerts([...certs, newCert]);
    setNewCertName('');
    setNewCertOrg('');
    setNewCertDate('');
    setShowCertForm(false);
  };

  // Salary calculations preview (Indian Payroll Formulas)
  const previewGross = +(salaryForm.ctc / 12).toFixed(2);
  const previewBasic = +(previewGross * salaryForm.basicPct / 100).toFixed(2);
  const previewHra = +(previewBasic * salaryForm.hraPct / 100).toFixed(2);
  const previewSpecial = +(
    previewGross -
    previewBasic -
    previewHra -
    salaryForm.conveyanceFixed -
    salaryForm.medicalFixed
  ).toFixed(2);
  const previewPf = +(previewBasic * salaryForm.pfPct / 100).toFixed(2);
  const previewNet = +(
    previewGross -
    previewPf -
    salaryForm.professionalTax -
    salaryForm.incomeTax
  ).toFixed(2);

  // Salary save
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalarySaving(true);

    try {
      const res = await apiRequest(`/payroll/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ctc: Number(salaryForm.ctc),
          effectiveFrom: salaryForm.effectiveFrom,
          basicPct: Number(salaryForm.basicPct),
          hraPct: Number(salaryForm.hraPct),
          conveyanceFixed: Number(salaryForm.conveyanceFixed),
          medicalFixed: Number(salaryForm.medicalFixed),
          pfPct: Number(salaryForm.pfPct),
          professionalTax: Number(salaryForm.professionalTax),
          incomeTax: Number(salaryForm.incomeTax),
        }),
      });

      setPayroll(res);
      setEditSalaryMode(false);
      setSalarySavedMsg(true);
      setTimeout(() => setSalarySavedMsg(false), 3000);
    } catch (err: any) {
      if (err instanceof ResponseError) {
        alert(err.errorData.message);
      } else {
        alert('Failed to update salary structure.');
      }
    } finally {
      setSalarySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-sans">
        <svg className="animate-spin h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (errorMsg || !employee) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center font-sans">
        <Shield className="h-12 w-12 text-status-absent mx-auto mb-4" />
        <h3 className="text-lg font-bold">Profile Access Error</h3>
        <p className="text-sm text-text-muted mt-2">{errorMsg || 'Employee profile could not be loaded.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-accent text-background rounded-lg font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-semibold text-2xl font-display shadow-sm">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-text">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-text-muted font-mono mt-0.5">{employee.loginId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left md:text-right">
            <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Department</span>
            <span className="text-sm font-bold text-accent">{employee.department?.name || 'Unassigned'}</span>
          </div>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="text-left md:text-right">
            <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Position</span>
            <span className="text-sm font-semibold text-text">{employee.jobPosition?.title || 'Team Member'}</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border/80 gap-6">
        {(['resume', 'private', 'salary'] as const).map((tab) => {
          if (tab === 'salary' && !canViewSalary) return null;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold relative transition-colors ${
                activeTab === tab ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {tab === 'resume' && 'Resume & Skills'}
              {tab === 'private' && 'Private Information'}
              {tab === 'salary' && 'Salary & Payroll'}

              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <AnPresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* 1. RESUME TAB */}
          {activeTab === 'resume' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left detail card */}
              <div className="md:col-span-1 space-y-6">
                <Card title="Employment Details">
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-xs text-text-muted block font-semibold uppercase">Reports To</span>
                      <span className="font-semibold">
                        {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'Direct report to CEO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block font-semibold uppercase">Date of Joining</span>
                      <span className="font-mono">{new Date(employee.hireDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block font-semibold uppercase">Official Email</span>
                      <span className="text-accent underline font-mono">{employee.email}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right content - Skills & Certs */}
              <div className="md:col-span-2 space-y-6">
                {/* Skills */}
                <Card
                  title="Skills & Expertises"
                  action={
                    <button
                      onClick={() => setShowSkillForm(!showSkillForm)}
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Skill
                    </button>
                  }
                >
                  {showSkillForm && (
                    <form onSubmit={handleAddSkill} className="p-4 bg-background border border-border rounded-lg mb-6 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Skill Name</label>
                        <input
                          type="text"
                          required
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="e.g. TypeScript"
                          className="w-full px-3 py-1.5 bg-surface border border-border rounded text-sm mt-1 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase">Proficiency</label>
                        <select
                          value={newSkillProf}
                          onChange={(e) => setNewSkillProf(e.target.value)}
                          className="w-full px-3 py-1.5 bg-surface border border-border rounded text-sm mt-1 focus:outline-none"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <button type="submit" className="px-4 py-2 bg-accent text-background rounded text-sm font-semibold">
                        Add
                      </button>
                    </form>
                  )}

                  {skills.length === 0 ? (
                    <p className="text-sm text-text-muted py-2">No skills registered on profile yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {skills.map((s, idx) => (
                        <div key={s.id || idx} className="bg-background border border-border px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="text-sm font-medium text-text">{s.name}</span>
                          <span className="text-[10px] uppercase font-bold text-accent px-1.5 py-0.5 bg-accent/15 rounded">
                            {s.proficiency}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Certifications */}
                <Card
                  title="Certifications"
                  action={
                    <button
                      onClick={() => setShowCertForm(!showCertForm)}
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Cert
                    </button>
                  }
                >
                  {showCertForm && (
                    <form onSubmit={handleAddCert} className="p-4 bg-background border border-border rounded-lg mb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Certification Name"
                          placeholder="e.g. AWS Solutions Architect"
                          required
                          value={newCertName}
                          onChange={(e) => setNewCertName(e.target.value)}
                        />
                        <FormField
                          label="Issuing Organisation"
                          placeholder="e.g. Amazon Web Services"
                          required
                          value={newCertOrg}
                          onChange={(e) => setNewCertOrg(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4 items-end">
                        <FormField
                          label="Issue Date"
                          type="date"
                          required
                          value={newCertDate}
                          onChange={(e) => setNewCertDate(e.target.value)}
                        />
                        <button type="submit" className="px-5 py-2.5 bg-accent text-background rounded-lg font-semibold shrink-0">
                          Add Certification
                        </button>
                      </div>
                    </form>
                  )}

                  {certs.length === 0 ? (
                    <p className="text-sm text-text-muted py-2">No certifications listed on profile yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {certs.map((c, idx) => (
                        <div key={c.id || idx} className="bg-background border border-border p-4 rounded-xl flex gap-3.5 items-start">
                          <Award className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-text text-sm">{c.name}</h5>
                            <p className="text-xs text-text-muted mt-1">{c.issuingOrg}</p>
                            {c.issueDate && (
                              <p className="text-[10px] text-text-muted/80 mt-1 font-mono">
                                Issued: {new Date(c.issueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* 2. PRIVATE INFO TAB */}
          {activeTab === 'private' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h4 className="text-lg font-semibold text-text font-display">Personal & Banking Records</h4>
                <div className="flex items-center gap-3">
                  {profileSavedMsg && (
                    <span className="text-xs text-status-present font-semibold flex items-center gap-1.5">
                      <Check className="h-4 w-4" /> Saved Successfully!
                    </span>
                  )}
                  {!editProfileMode ? (
                    <button
                      type="button"
                      onClick={() => setEditProfileMode(true)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-border bg-surface text-text hover:bg-background rounded-lg font-semibold text-sm transition-all shadow-sm"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditProfileMode(false)}
                        className="px-4 py-2 border border-border text-text hover:bg-surface rounded-lg font-semibold text-sm transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-4 py-2 bg-accent text-background rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                      >
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact & Personal details */}
                <Card title="Contact & Demographics">
                  <div className="space-y-4">
                    <FormField
                      label="Phone Number"
                      disabled={!editProfileMode}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <FormField
                      label="Residential Address"
                      disabled={!editProfileMode}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="City"
                        disabled={!editProfileMode}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <FormField
                        label="Postal Code (Pincode)"
                        disabled={!editProfileMode}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text uppercase tracking-wider">Gender</label>
                        <select
                          disabled={!editProfileMode || !canEditAllProfileFields}
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none disabled:opacity-60"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <FormField
                        label="Date of Birth"
                        type="date"
                        disabled={!editProfileMode || !canEditAllProfileFields}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Nationality"
                        disabled={!editProfileMode || !canEditAllProfileFields}
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text uppercase tracking-wider">Marital Status</label>
                        <select
                          disabled={!editProfileMode || !canEditAllProfileFields}
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none disabled:opacity-60"
                        >
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Emergency & Bank details */}
                <div className="space-y-6">
                  <Card title="Emergency Contact">
                    <div className="space-y-4">
                      <FormField
                        label="Contact Name"
                        disabled={!editProfileMode || !canEditAllProfileFields}
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                      />
                      <FormField
                        label="Contact Phone"
                        disabled={!editProfileMode || !canEditAllProfileFields}
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      />
                    </div>
                  </Card>

                  <Card title="Bank Account Details">
                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="text-xs text-text-muted block font-semibold uppercase">Bank Name</span>
                        <span className="font-semibold">{employee.bankDetail?.bankName || 'SBI'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-text-muted block font-semibold uppercase">Account Number</span>
                          <span className="font-mono">{employee.bankDetail?.accountNumber || '••••••••1029'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-muted block font-semibold uppercase">IFSC Code</span>
                          <span className="font-mono">{employee.bankDetail?.ifscCode || 'SBIN0007890'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
          )}

          {/* 3. SALARY INFO TAB */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h4 className="text-lg font-semibold text-text font-display">Salary Component Allocation</h4>
                {canEditSalary && (
                  <div className="flex items-center gap-3">
                    {salarySavedMsg && (
                      <span className="text-xs text-status-present font-semibold flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Saved structure!
                      </span>
                    )}
                    {!editSalaryMode ? (
                      <button
                        onClick={() => setEditSalaryMode(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-border bg-surface text-text hover:bg-background rounded-lg font-semibold text-sm transition-all shadow-sm"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Configure Salary
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditSalaryMode(false)}
                          className="px-4 py-2 border border-border text-text hover:bg-surface rounded-lg font-semibold text-sm transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSalary}
                          disabled={salarySaving}
                          className="px-4 py-2 bg-accent text-background rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                        >
                          {salarySaving ? 'Saving...' : 'Save Structure'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editSalaryMode ? (
                /* Admin/HR configure salary form with dynamic calculations preview */
                <form onSubmit={handleSaveSalary} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 space-y-4 bg-surface p-6 border border-border rounded-xl">
                    <h5 className="font-semibold text-text border-b border-border pb-2 mb-3">Formula Variables</h5>
                    <FormField
                      label="Annual CTC (INR)"
                      type="number"
                      required
                      value={salaryForm.ctc}
                      onChange={(e) => setSalaryForm({ ...salaryForm, ctc: Number(e.target.value) })}
                    />
                    <FormField
                      label="Effective From"
                      type="date"
                      required
                      value={salaryForm.effectiveFrom}
                      onChange={(e) => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })}
                    />
                    <FormField
                      label="Basic Salary %"
                      type="number"
                      value={salaryForm.basicPct}
                      onChange={(e) => setSalaryForm({ ...salaryForm, basicPct: Number(e.target.value) })}
                    />
                    <FormField
                      label="HRA % of Basic"
                      type="number"
                      value={salaryForm.hraPct}
                      onChange={(e) => setSalaryForm({ ...salaryForm, hraPct: Number(e.target.value) })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Conveyance"
                        type="number"
                        value={salaryForm.conveyanceFixed}
                        onChange={(e) => setSalaryForm({ ...salaryForm, conveyanceFixed: Number(e.target.value) })}
                      />
                      <FormField
                        label="Medical"
                        type="number"
                        value={salaryForm.medicalFixed}
                        onChange={(e) => setSalaryForm({ ...salaryForm, medicalFixed: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="PF %"
                        type="number"
                        value={salaryForm.pfPct}
                        onChange={(e) => setSalaryForm({ ...salaryForm, pfPct: Number(e.target.value) })}
                      />
                      <FormField
                        label="Professional Tax"
                        type="number"
                        value={salaryForm.professionalTax}
                        onChange={(e) => setSalaryForm({ ...salaryForm, professionalTax: Number(e.target.value) })}
                      />
                    </div>
                    <FormField
                      label="Monthly Income Tax (TDS)"
                      type="number"
                      value={salaryForm.incomeTax}
                      onChange={(e) => setSalaryForm({ ...salaryForm, incomeTax: Number(e.target.value) })}
                    />
                  </div>

                  {/* Calculations Live Preview */}
                  <div className="md:col-span-2 space-y-6">
                    <Card title="Live Calculation Preview" subtitle="Real-time audit before database submission.">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Monthly Gross:</span>
                          <span className="font-mono text-accent text-lg">₹{previewGross.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-semibold border-b border-border pb-3">
                          <span>Estimated Net Take Home:</span>
                          <span className="font-mono text-status-present text-lg">₹{previewNet.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <p className="font-semibold text-text-muted mt-2">EARNINGS BREAKDOWN</p>
                          <div className="flex justify-between text-text">
                            <span>Basic Salary ({salaryForm.basicPct}%):</span>
                            <span className="font-mono">₹{previewBasic.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text">
                            <span>House Rent Allowance ({salaryForm.hraPct}% of Basic):</span>
                            <span className="font-mono">₹{previewHra.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text">
                            <span>Conveyance Allowance (Fixed):</span>
                            <span className="font-mono">₹{salaryForm.conveyanceFixed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text">
                            <span>Medical Allowance (Fixed):</span>
                            <span className="font-mono">₹{salaryForm.medicalFixed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text font-bold">
                            <span>Special Allowance (Remainder):</span>
                            <span className="font-mono text-accent">₹{previewSpecial.toLocaleString()}</span>
                          </div>

                          <p className="font-semibold text-text-muted mt-4">DEDUCTIONS BREAKDOWN</p>
                          <div className="flex justify-between text-text">
                            <span>Provident Fund (PF) ({salaryForm.pfPct}% of Basic):</span>
                            <span className="font-mono">₹{previewPf.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text">
                            <span>Professional Tax (PT):</span>
                            <span className="font-mono">₹{salaryForm.professionalTax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text">
                            <span>Income Tax (TDS):</span>
                            <span className="font-mono">₹{salaryForm.incomeTax.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </form>
              ) : (
                /* Read-Only Salary Structure */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Totals Summary */}
                  <div className="md:col-span-1 space-y-6">
                    <Card title="Compensation Summary">
                      <div className="space-y-5">
                        <div>
                          <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Annual Cost to Company</span>
                          <span className="text-2xl font-mono font-bold text-accent">₹{(payroll?.annualCTC || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-border/60" />
                        <div>
                          <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Gross Monthly Wage</span>
                          <span className="text-xl font-mono font-bold text-text">₹{(payroll?.monthlyGross || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Net Take-Home Pay</span>
                          <span className="text-xl font-mono font-bold text-status-present">
                            ₹{(payroll?.monthlyNet || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Components Breakdown Table */}
                  <div className="md:col-span-2">
                    <Card title="Allocated Components List">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border/80 text-text-muted font-bold text-xs uppercase">
                              <th className="py-2.5">Component Name</th>
                              <th className="py-2.5">Category</th>
                              <th className="py-2.5 text-right">Monthly Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 font-mono text-xs">
                            {payroll?.components?.map((comp: any) => (
                              <tr key={comp.id} className="hover:bg-background/10">
                                <td className="py-3 capitalize text-text font-semibold font-sans">
                                  {comp.name.replace(/_/g, ' ')}
                                </td>
                                <td className="py-3 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    comp.type === 'earning' ? 'bg-status-present/15 text-status-present' : 'bg-status-absent/15 text-status-absent'
                                  }`}>
                                    {comp.type}
                                  </span>
                                </td>
                                <td className="py-3 text-right text-text font-bold">
                                  ₹{Number(comp.amount).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {payroll?.structure?.effectiveFrom && (
                        <p className="text-[10px] text-text-muted/80 mt-6 text-right">
                          Active Structure effective from:{' '}
                          <span className="font-mono">{new Date(payroll.structure.effectiveFrom).toLocaleDateString()}</span>
                        </p>
                      )}
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnPresence>
    </div>
  );
}

// Custom wrapper to avoid Next.js bundling issues
function AnPresence({ children, ...props }: any) {
  return <AnimatePresence {...props}>{children}</AnimatePresence>;
}
