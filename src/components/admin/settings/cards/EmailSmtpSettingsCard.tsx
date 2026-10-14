import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Key,
  Globe,
  Info,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface EmailSmtpSettingsCardProps {
  settings: AdminSettingsData['emailSmtp'];
  onSave: (data: AdminSettingsData['emailSmtp']) => Promise<void>;
  isSaving: boolean;
  onToast: (msg: string) => void;
}

export const EmailSmtpSettingsCard: React.FC<EmailSmtpSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
  onToast,
}) => {
  const [smtpHost, setSmtpHost] = useState(settings.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(String(settings.port || '587'));
  const [smtpSecurity, setSmtpSecurity] = useState<'STARTTLS' | 'SSL' | 'NONE'>(settings.security || 'STARTTLS');
  const [smtpUser, setSmtpUser] = useState(settings.user || 'pharmayushtechteam@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState(settings.senderName || 'India2World Invoicing');
  const [isPassConfigured, setIsPassConfigured] = useState(settings.passSet);
  const [showPassword, setShowPassword] = useState(false);

  const [testRecipient, setTestRecipient] = useState(settings.testRecipient || 'pharmayushtechteam@gmail.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
    details?: any;
  } | null>(null);

  const [domainSecurity, setDomainSecurity] = useState<{
    isGmail: boolean;
    domain: string;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
    guidance: string;
  } | null>(null);

  const [showAppPassGuide, setShowAppPassGuide] = useState(false);

  // Load live SMTP configuration status from backend
  const loadSmtpStatus = async () => {
    try {
      const res = await fetch('/api/smtp-status');
      if (res.ok) {
        const data = await res.json();
        if (data.host) setSmtpHost(data.host);
        if (data.port) setSmtpPort(String(data.port));
        if (data.security) setSmtpSecurity(data.security);
        if (data.user) {
          setSmtpUser(data.user);
          if (!testRecipient) setTestRecipient(data.user);
          fetchDomainSecurity(data.user);
        }
        if (data.senderName) setSmtpSenderName(data.senderName);
        setIsPassConfigured(Boolean(data.passSet || data.configured));
      }
    } catch (err) {
      console.error('Error fetching SMTP status:', err);
    }
  };

  const fetchDomainSecurity = async (email: string) => {
    try {
      const res = await fetch(`/api/domain-security-advice?sender=${encodeURIComponent(email)}`);
      if (res.ok) {
        const secData = await res.json();
        setDomainSecurity(secData);
      }
    } catch (e) {
      console.error('Error fetching domain security advice:', e);
    }
  };

  useEffect(() => {
    loadSmtpStatus();
  }, []);

  // Real SMTP connection test
  const handleTestConnection = async () => {
    setIsTestingSmtp(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-smtp-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: Number(smtpPort),
          security: smtpSecurity,
          user: smtpUser.trim(),
          pass: smtpPass.trim() || undefined,
          senderName: smtpSenderName.trim(),
          testRecipient: testRecipient.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          details: data.details,
        });
        onToast('✅ Real SMTP connection verified successfully!');
      } else {
        setTestResult({
          success: false,
          message: data.message || 'SMTP Authentication Failed',
          error: data.error || 'Could not verify credentials with mail server.',
        });
        onToast('❌ SMTP connection test failed. Check details below.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Connection to server failed',
        error: err.message || 'Network error while testing connection.',
      });
      onToast('❌ Network error while testing SMTP connection.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Full Diagnostic Test with Real PDF Attachment & DSN Verification
  const handleRunDiagnosticTest = async () => {
    setIsTestingSmtp(true);
    setTestResult(null);

    const target = testRecipient.trim() || smtpUser.trim();
    if (!target) {
      onToast('⚠️ Please enter a recipient email address.');
      setIsTestingSmtp(false);
      return;
    }

    try {
      const res = await fetch('/api/send-diagnostic-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: target,
          testType: 'invoice_pdf_diagnostic',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          details: {
            host: data.host,
            port: data.port,
            security: data.security,
            user: data.sender,
            emailSent: true,
            messageId: data.messageId,
            response: data.response,
            pdfAttached: data.pdfAttached,
            pdfSizeBytes: data.pdfSizeBytes,
            dsnEnabled: data.dsnEnabled,
            deliveryNote: data.deliveryNote,
            inboxAdvice: data.inboxAdvice,
          },
        });
        onToast(`✅ Diagnostic sample invoice PDF dispatched to ${target}!`);
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Diagnostic Test Failed',
          error: data.error || 'SMTP delivery failed.',
        });
        onToast('❌ Diagnostic test failed. See error details below.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Connection failed',
        error: err.message,
      });
      onToast('❌ Network error while executing diagnostic test.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpPass && !isPassConfigured) {
      onToast('⚠️ Please enter your Google App Password to enable live invoice emailing.');
      return;
    }

    try {
      const res = await fetch('/api/save-smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: Number(smtpPort),
          security: smtpSecurity,
          user: smtpUser.trim(),
          pass: smtpPass.trim() || undefined,
          senderName: smtpSenderName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save SMTP configuration.');
      }

      setIsPassConfigured(true);
      setSmtpPass(''); // Never keep password in input once saved
      await loadSmtpStatus();

      // Also persist to settings backend
      await onSave({
        host: smtpHost.trim(),
        port: Number(smtpPort),
        security: smtpSecurity,
        user: smtpUser.trim(),
        senderName: smtpSenderName.trim(),
        passSet: true,
        testRecipient: testRecipient.trim(),
      });

      onToast('🎉 SMTP configuration verified and saved successfully!');
    } catch (err: any) {
      onToast(`❌ Error saving SMTP: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Email & SMTP Configuration
              </h2>
              <p className="text-[11px] text-slate-400">
                Google Gmail SMTP for automated invoice dispatch and customer communications
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isPassConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Live SMTP Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>App Password Required</span>
              </span>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <form id="smtp-settings-form" onSubmit={handleSaveSmtp} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                SMTP Host Server
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Encryption Method
              </label>
              <select
                value={smtpSecurity}
                onChange={(e) => {
                  const val = e.target.value as 'STARTTLS' | 'SSL' | 'NONE';
                  setSmtpSecurity(val);
                  if (val === 'SSL' && smtpPort === '587') setSmtpPort('465');
                  if (val === 'STARTTLS' && smtpPort === '465') setSmtpPort('587');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="STARTTLS">STARTTLS (587)</option>
                <option value="SSL">SSL / TLS (465)</option>
                <option value="NONE">None (25)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gmail Sender Email
              </label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="pharmayushtechteam@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                value={smtpSenderName}
                onChange={(e) => setSmtpSenderName(e.target.value)}
                placeholder="India2World Invoicing"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Google App Password (16 Characters)
                </label>
                {isPassConfigured && !smtpPass && (
                  <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Encrypted & Stored on Server</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={
                    isPassConfigured
                      ? '•••••••••••••••• (Leave blank to keep saved password)'
                      : '16-character App Password (e.g. abcd efgh ijkl mnop)'
                  }
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Google App Password Guidance */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAppPassGuide(!showAppPassGuide)}
                className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#0066FF] cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>How to generate a Google 16-character App Password</span>
              </button>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#0066FF] hover:underline flex items-center gap-1"
              >
                <span>Google Portal</span>
                <Globe className="w-3 h-3" />
              </a>
            </div>

            {showAppPassGuide && (
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 mt-2.5 pt-2.5 border-t border-slate-200/70">
                <li>Sign in to your Google Account and go to <strong>Security</strong>.</li>
                <li>Make sure <strong>2-Step Verification</strong> is enabled.</li>
                <li>Search for <strong>"App passwords"</strong> in the settings search bar.</li>
                <li>Create an app named <strong>"India2World"</strong> and copy the 16 characters.</li>
                <li>Paste into the field above and click <strong>Save Configuration</strong>.</li>
              </ol>
            )}
          </div>

          {/* Domain Security & Anti-Spam Guidance (SPF / DKIM / DMARC) */}
          {domainSecurity && (
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Domain Authentication (@{domainSecurity.domain})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0066FF]">
                  {domainSecurity.isGmail ? 'Gmail Managed Auth' : 'Custom DNS'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <div className="text-slate-400 font-bold uppercase text-[9px]">SPF</div>
                  <div className="font-mono text-slate-700 truncate">{domainSecurity.spfStatus}</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <div className="text-slate-400 font-bold uppercase text-[9px]">DKIM</div>
                  <div className="font-mono text-slate-700 truncate">{domainSecurity.dkimStatus}</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <div className="text-slate-400 font-bold uppercase text-[9px]">DMARC</div>
                  <div className="font-mono text-slate-700 truncate">{domainSecurity.dmarcStatus}</div>
                </div>
              </div>
            </div>
          )}

          {/* Real Handshake & Diagnostic Test Toolbar */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600 shrink-0">Test Recipient:</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="test-recipient@example.com"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isTestingSmtp}
                onClick={handleTestConnection}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isTestingSmtp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-slate-500" />}
                <span>Test Handshake</span>
              </button>

              <button
                type="button"
                disabled={isTestingSmtp}
                onClick={handleRunDiagnosticTest}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isTestingSmtp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3 text-[#0066FF]" />}
                <span>Send Diagnostic Invoice (with PDF)</span>
              </button>
            </div>
          </div>

          {/* Real Diagnostic Result Box */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.error && (
                    <div className="p-2 bg-white/70 border border-red-200 rounded-xl font-mono text-[10.5px] text-red-800 break-words">
                      {testResult.error}
                    </div>
                  )}
                  {testResult.details && (
                    <div className="text-[10.5px] font-mono bg-white/70 p-2.5 rounded-xl border border-emerald-200 space-y-0.5">
                      <div>Server: {testResult.details.host}:{testResult.details.port} ({testResult.details.security})</div>
                      <div>Sender: {testResult.details.user}</div>
                      <div>Response: {testResult.details.response || '250 2.0.0 OK'}</div>
                      {testResult.details.pdfAttached && (
                        <div className="text-emerald-700 font-bold">
                          ✓ PDF Attachment Verified: {testResult.details.pdfSizeBytes ? `${(testResult.details.pdfSizeBytes / 1024).toFixed(1)} KB` : 'Attached'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Credentials saved to encrypted server env</span>
        <button
          type="submit"
          form="smtp-settings-form"
          disabled={isSaving}
          className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
