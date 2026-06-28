export function DesignSystemView() {
  return (
    <div className="flex-1 h-full overflow-y-auto w-full p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-16">
        
        <header>
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Vyntra Design System</h1>
          <p className="text-vyntra-text-sec text-lg">Apple-level elegance, Tesla-level simplicity, OpenAI-level intelligence.</p>
        </header>

        <section>
          <h2 className="text-sm font-mono text-vyntra-text-sec uppercase mb-6 tracking-widest border-b border-white/10 pb-2">01. Color Palette</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Primary', class: 'bg-vyntra-primary', hex: '#6C5CE7' },
              { name: 'Secondary', class: 'bg-vyntra-secondary', hex: '#00D4FF' },
              { name: 'Accent', class: 'bg-vyntra-accent', hex: '#00FFA3' },
              { name: 'Background', class: 'bg-vyntra-bg border border-white/10', hex: '#0B0F19' },
              { name: 'Surface', class: 'bg-vyntra-surface', hex: '#131A29' },
              { name: 'Card', class: 'bg-vyntra-card', hex: '#1B2435' },
              { name: 'Success', class: 'bg-vyntra-success', hex: '#00FF95' },
              { name: 'Error', class: 'bg-vyntra-error', hex: '#FF5A5F' },
            ].map(c => (
              <div key={c.name} className="flex flex-col gap-2">
                <div className={`h-24 rounded-2xl ${c.class}`}></div>
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs font-mono text-vyntra-text-sec">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-mono text-vyntra-text-sec uppercase mb-6 tracking-widest border-b border-white/10 pb-2">02. Glassmorphism Objects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative p-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-vyntra-primary/20 via-vyntra-bg to-vyntra-bg rounded-3xl overflow-hidden">
            
            <div className="glass-panel p-6 rounded-2xl relative z-10 animate-float">
              <h3 className="font-bold text-white mb-2">Glass Panel (.glass-panel)</h3>
              <p className="text-sm text-vyntra-text-sec">Base layer for sidebars, navigation, and large layout blocks. Subtly blurred.</p>
            </div>

            <div className="glass-card p-6 rounded-2xl relative z-10 animate-float" style={{ animationDelay: '1s' }}>
              <h3 className="font-bold text-white mb-2">Glass Card (.glass-card)</h3>
              <p className="text-sm text-vyntra-text-sec">Elevated component with stronger blur, borders, and deeper drop shadow for inner elements.</p>
            </div>
            
            <div className="w-48 h-48 bg-vyntra-primary/50 blur-[80px] rounded-full absolute top-0 left-0"></div>
            <div className="w-48 h-48 bg-vyntra-secondary/50 blur-[80px] rounded-full absolute bottom-0 right-0"></div>
          </div>
        </section>

        <section>
           <h2 className="text-sm font-mono text-vyntra-text-sec uppercase mb-6 tracking-widest border-b border-white/10 pb-2">03. Buttons & Interactions</h2>
           <div className="flex flex-wrap gap-6 items-center bg-vyntra-surface/30 p-8 rounded-3xl border border-white/5">
             <button className="bg-white text-vyntra-bg px-6 py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-all">Primary Action</button>
             <button className="bg-gradient-to-r from-vyntra-primary to-vyntra-secondary text-white px-6 py-2.5 rounded-full font-bold shadow-[0_4px_15px_rgba(108,92,231,0.3)] hover:opacity-90 transition-all hover:-translate-y-0.5">Gradient Magic</button>
             <button className="glass-button text-white px-6 py-2.5 rounded-full font-medium">Glass Secondary</button>
             <button className="text-vyntra-text-sec hover:text-white font-medium transition-colors">Ghost Link</button>
           </div>
        </section>

      </div>
    </div>
  );
}
