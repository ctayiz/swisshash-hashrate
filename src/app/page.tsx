import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Zap, Clock, Shield, Server, ArrowRight, CheckCircle2,
  CreditCard, Settings, Play, ChevronRight,
} from 'lucide-react'

const FEATURED_PACKAGES = [
  { th: 120, days: 1, price: 12, label: 'Starter', highlight: false },
  { th: 300, days: 3, price: 72, label: 'Pro', highlight: true },
  { th: 500, days: 5, price: 170, label: 'Enterprise', highlight: false },
]

const FEATURES = [
  { icon: Zap,    title: 'Sofortige Aktivierung',  desc: 'Deine Hashrate ist innerhalb von Minuten nach Zahlung aktiv.' },
  { icon: Clock,  title: 'Flexible Laufzeiten',    desc: '1, 3 oder 5 Tage — wähle das Paket das zu dir passt.' },
  { icon: Shield, title: 'Sicher & Transparent',   desc: 'Alle Pool-Verbindungen werden von dir selbst konfiguriert.' },
  { icon: Server, title: 'Eigener Pool-Support',   desc: 'Verbinde F2Pool, EMCD, Antpool und viele weitere Pools.' },
]

const HOW_IT_WORKS = [
  {
    icon: CreditCard,
    step: '01',
    title: 'Paket buchen',
    desc: 'Wähle Hashrate und Laufzeit. Bezahle sicher online — keine Hardware, kein Aufwand.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Pool konfigurieren',
    desc: 'Trage einmalig deine Mining-Pool-Daten ein. Stratum-URL und Worker-Name genügen.',
  },
  {
    icon: Play,
    step: '03',
    title: 'Mining startet',
    desc: 'Nach Zahlungseingang wird deine Hashrate automatisch aktiviert. Dein Pool empfängt die Shares.',
  },
]

const FAQS = [
  {
    q: 'Was ist Hashrate Hosting?',
    a: 'Du mietest Rechenleistung (Hashrate) eines Bitcoin-Miners. Die Erträge gehen direkt in deinen Mining-Pool — kein eigenes Gerät nötig.',
  },
  {
    q: 'Welche Mining-Pools werden unterstützt?',
    a: 'Jeder Pool mit Stratum-Protokoll funktioniert: F2Pool, EMCD, Antpool, ViaBTC, Braiins und weitere.',
  },
  {
    q: 'Wann wird meine Bestellung aktiviert?',
    a: 'Unmittelbar nach Zahlungseingang — in der Regel innerhalb weniger Minuten.',
  },
  {
    q: 'Kann ich die Laufzeit verlängern?',
    a: 'Ja, du kannst jederzeit ein neues Paket buchen. Die Hahraten werden dann automatisch zusammengeführt.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 sticky top-0 bg-slate-950/80 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">SwissHash</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500">
                Anmelden
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Registrieren
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          Bitcoin Mining Hashrate Hosting
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Bitcoin-Mining ohne
          <br />
          <span className="text-orange-400">eigene Hardware</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          Miete Hashrate-Pakete ab 120 TH/s und leite die Rechenleistung direkt in
          deinen eigenen Mining-Pool. Flexibel, transparent, sofort aktiv.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Jetzt starten <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500 px-8">
              Anmelden
            </Button>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800 rounded-2xl overflow-hidden border border-slate-800">
          {[
            { value: '120–500', unit: 'TH/s',   label: 'Hashrate-Pakete' },
            { value: '1–5',     unit: 'Tage',    label: 'Flexible Laufzeiten' },
            { value: '< 5',     unit: 'Min',     label: 'Aktivierungszeit' },
            { value: '24/7',    unit: '',         label: 'Betrieb & Support' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 px-6 py-5 text-center">
              <div className="text-2xl font-extrabold text-white">
                {s.value}<span className="text-orange-400 text-lg ml-1">{s.unit}</span>
              </div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">So funktioniert es</h2>
          <p className="text-slate-400">In drei Schritten zu deiner aktiven Hashrate.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          {/* connector line */}
          <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-slate-700 via-orange-500/40 to-slate-700" />
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5 relative z-10">
                <step.icon className="w-8 h-8 text-orange-400" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  {step.step.replace('0', '')}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => (
            <Card key={f.title} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="p-2.5 bg-orange-500/10 rounded-lg w-fit mb-4">
                  <f.icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Beliebte Pakete</h2>
          <p className="text-slate-400">Alle 9 Pakete — 3 Hashrates × 3 Laufzeiten — sind nach der Registrierung buchbar.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {FEATURED_PACKAGES.map(pkg => (
            <div
              key={`${pkg.th}-${pkg.days}`}
              className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${
                pkg.highlight
                  ? 'border-orange-500/50 ring-1 ring-orange-500/30 scale-[1.03]'
                  : 'border-slate-700 hover:border-slate-600'
              } bg-slate-800/50`}
            >
              {pkg.highlight && (
                <div className="bg-orange-500 text-white text-xs font-bold text-center py-1.5 tracking-wide">
                  BELIEBTESTE WAHL
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">{pkg.label}</div>
                <div className="text-3xl font-extrabold text-white mb-1">{pkg.th} TH/s</div>
                <div className="text-slate-400 text-sm mb-5">
                  {pkg.days} {pkg.days === 1 ? 'Tag' : 'Tage'}
                </div>
                <div className="text-2xl font-bold text-white mb-6">
                  <span className="text-slate-400 text-base font-normal">ab </span>${pkg.price}
                </div>
                <ul className="space-y-2 text-sm text-slate-400 mb-6 flex-1">
                  {[
                    `${pkg.th} TH/s Hashrate`,
                    `${pkg.days} ${pkg.days === 1 ? 'Tag' : 'Tage'} Laufzeit`,
                    'Eigener Mining-Pool',
                    'Sofortige Aktivierung',
                  ].map(feat => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full font-semibold ${pkg.highlight ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                    Jetzt buchen
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-8">
          Weitere Kombinationen verfügbar nach der Registrierung.{' '}
          <Link href="/register" className="text-orange-400 hover:text-orange-300">
            Jetzt registrieren <ChevronRight className="inline w-3.5 h-3.5" />
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Häufige Fragen</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <div key={faq.q} className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-5">
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-orange-500/10 to-slate-800/60 border border-orange-500/20 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Bereit zum Mining?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Erstelle jetzt kostenlos ein Konto und buche dein erstes Hashrate-Paket in wenigen Minuten.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10">
              Kostenlos registrieren <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>SwissHash © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Anmelden</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Registrieren</Link>
            <a href="mailto:ticket@swisshash.com" className="hover:text-slate-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
