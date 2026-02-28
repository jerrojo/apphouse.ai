'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;
type Vibe = 'minimal' | 'playful' | 'corporate' | 'premium' | 'bold';

interface IntakeForm {
  oneSentence: string;
  targetUser: string;
  problemSolved: string;
  platforms: { web: boolean; ios: boolean; android: boolean };
  desiredDomain: string;
  revenueModel: string;
  vibe: Vibe;
  referenceUrls: string;
  additionalNotes: string;
}

const INITIAL_FORM: IntakeForm = {
  oneSentence: '',
  targetUser: '',
  problemSolved: '',
  platforms: { web: true, ios: false, android: false },
  desiredDomain: '',
  revenueModel: 'free',
  vibe: 'minimal',
  referenceUrls: '',
  additionalNotes: '',
};

function generateSlug(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '');
}

function getPlatformString(p: { web: boolean; ios: boolean; android: boolean }): string {
  if (p.web && (p.ios || p.android)) return 'full';
  if (p.ios || p.android) return 'mobile';
  return 'web';
}

export default function NewAppPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<IntakeForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const update = (field: keyof IntakeForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 1) return form.oneSentence.trim().length > 10;
    if (step === 2) return Object.values(form.platforms).some(Boolean);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?next=/new';
        return;
      }

      // 2. Create the app
      const slug = generateSlug(form.oneSentence) || `app-${Date.now()}`;
      const name = form.oneSentence.slice(0, 60);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: app, error: appError } = await (supabase as any)
        .from('apps')
        .insert({
          slug,
          name,
          description: form.problemSolved || null,
          status: 'draft',
          platforms: getPlatformString(form.platforms),
          domain: form.desiredDomain || null,
          vibe: form.vibe,
          revenue_model: form.revenueModel,
          created_by: user.id,
          config: {},
        })
        .select()
        .single();

      if (appError) throw appError;

      // 3. Create the order
      const refs = form.referenceUrls.trim()
        ? form.referenceUrls.split('\n').map((u) => u.trim()).filter(Boolean)
        : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: order, error: orderError } = await (supabase as any)
        .from('app_orders')
        .insert({
          app_id: app.id,
          creator_id: user.id,
          one_sentence: form.oneSentence,
          target_user: form.targetUser || null,
          problem_solved: form.problemSolved || null,
          platforms: getPlatformString(form.platforms),
          desired_domain: form.desiredDomain || null,
          revenue_model: form.revenueModel,
          vibe: form.vibe,
          reference_urls: refs,
          additional_notes: form.additionalNotes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Update app status to cooking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('apps')
        .update({ status: 'cooking' })
        .eq('id', app.id);

      // 5. Create pipeline run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: pipelineError } = await (supabase as any)
        .from('pipeline_runs')
        .insert({
          app_id: app.id,
          order_id: order.id,
          status: 'queued',
          current_agent: 'ux',
          progress: 0,
        });

      if (pipelineError) throw pipelineError;

      // 6. Redirect to home (later: redirect to /cooking/[id])
      window.location.href = '/';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'something went wrong';
      setError(message);
      console.error('submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight text-gray-900">
            apphouse<span className="text-blue-600">.ai</span>
          </a>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            cancel
          </a>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 pt-32 pb-24">
        {/* step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-gray-900 text-white'
                    : s < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-green-200' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-400">
            {step === 1 ? 'the idea' : step === 2 ? 'scope' : 'personality'}
          </span>
        </div>

        {/* step 1: the idea */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">what are we building?</h1>
              <p className="text-gray-500">tell us about your app. our agents will handle the rest.</p>
            </div>

            <div>
              <label htmlFor="oneSentence" className="block text-sm font-medium text-gray-700 mb-1.5">
                describe your app in one sentence *
              </label>
              <input
                id="oneSentence"
                type="text"
                value={form.oneSentence}
                onChange={(e) => update('oneSentence', e.target.value)}
                placeholder="a crm that helps freelancers track clients and invoices..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm"
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="targetUser" className="block text-sm font-medium text-gray-700 mb-1.5">
                who is it for?
              </label>
              <input
                id="targetUser"
                type="text"
                value={form.targetUser}
                onChange={(e) => update('targetUser', e.target.value)}
                placeholder="freelance designers, small agencies, solopreneurs..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="problemSolved" className="block text-sm font-medium text-gray-700 mb-1.5">
                what problem does it solve?
              </label>
              <textarea
                id="problemSolved"
                value={form.problemSolved}
                onChange={(e) => update('problemSolved', e.target.value)}
                placeholder="losing track of client conversations and project deadlines..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* step 2: scope */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">scope & platforms</h1>
              <p className="text-gray-500">where should your app live?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">platforms *</label>
              <div className="flex gap-3">
                {(['web', 'ios', 'android'] as const).map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all ${
                      form.platforms[p]
                        ? 'border-gray-900 bg-gray-50 font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.platforms[p]}
                      onChange={(e) =>
                        update('platforms', { ...form.platforms, [p]: e.target.checked })
                      }
                      className="sr-only"
                      aria-label={`${p} platform`}
                    />
                    <span className="text-sm">{p === 'ios' ? 'iOS' : p === 'android' ? 'Android' : 'Web'}</span>
                    {form.platforms[p] && <span className="text-green-600">✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1.5">
                domain (optional)
              </label>
              <input
                id="domain"
                type="text"
                value={form.desiredDomain}
                onChange={(e) => update('desiredDomain', e.target.value)}
                placeholder="myapp.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">we&apos;ll check availability via godaddy</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">revenue model</label>
              <div className="grid grid-cols-2 gap-2">
                {['free', 'freemium', 'subscription', 'pay_per_use', 'ads', 'one_time'].map((model) => (
                  <label
                    key={model}
                    className={`px-4 py-2.5 rounded-xl border cursor-pointer text-center transition-all text-sm ${
                      form.revenueModel === model
                        ? 'border-gray-900 bg-gray-50 font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="revenueModel"
                      value={model}
                      checked={form.revenueModel === model}
                      onChange={(e) => update('revenueModel', e.target.value)}
                      className="sr-only"
                    />
                    {model.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* step 3: personality */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">personality</h1>
              <p className="text-gray-500">how should your app feel?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">vibe</label>
              <div className="flex gap-2 flex-wrap">
                {(['minimal', 'playful', 'corporate', 'premium', 'bold'] as Vibe[]).map((v) => (
                  <label
                    key={v}
                    className={`px-5 py-2.5 rounded-full border cursor-pointer transition-all text-sm ${
                      form.vibe === v
                        ? 'border-gray-900 bg-gray-900 text-white font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vibe"
                      value={v}
                      checked={form.vibe === v}
                      onChange={(e) => update('vibe', e.target.value)}
                      className="sr-only"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="refs" className="block text-sm font-medium text-gray-700 mb-1.5">
                reference apps or websites (optional)
              </label>
              <textarea
                id="refs"
                value={form.referenceUrls}
                onChange={(e) => update('referenceUrls', e.target.value)}
                placeholder="paste urls of apps you like the look of..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm resize-none"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                anything else we should know? (optional)
              </label>
              <textarea
                id="notes"
                value={form.additionalNotes}
                onChange={(e) => update('additionalNotes', e.target.value)}
                placeholder="special features, integrations, branding notes..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* error message */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* navigation buttons */}
        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-6 py-3 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed()}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  starting...
                </>
              ) : (
                'start cooking →'
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
