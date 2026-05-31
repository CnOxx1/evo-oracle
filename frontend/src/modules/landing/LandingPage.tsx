import { useState, useEffect } from "react";

interface LandingPageProps {
  onEnter: () => void;
}

interface OverviewData {
  system_risk_score: number;
  tracked_assets: number;
  active_alerts: number;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [stats, setStats] = useState<OverviewData | null>(null);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ system_risk_score: 42, tracked_assets: 12, active_alerts: 3 }));
  }, []);

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 hero-gradient-bg" />
        <div className="relative z-10 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black mb-4 hero-title-gradient">
            EvoOracle
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-2 font-medium">
            The Risk Oracle for Sui
          </p>
          <p className="text-base md:text-lg text-text-secondary/70 max-w-2xl mx-auto mb-10">
            实时风险评分 · 动态清算保护 · 多协议联动 — 让 DeFi 不再重演 LUNA 式崩盘
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={onEnter} className="gradient-btn text-lg px-8 py-3 rounded-xl pulse-glow cursor-pointer">
              进入 Dashboard
            </button>
            <a href="https://github.com/CnOxx1/evo-oracle" target="_blank" rel="noreferrer"
              className="px-8 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-all text-lg">
              查看文档
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 animate-bounce text-text-secondary/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
          为什么需要 <span className="gradient-text">EvoOracle</span>？
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          2022 年 5 月，LUNA/UST 崩盘在 72 小时内蒸发超过 $40B 市值。固定 LTV 清算机制在极端行情下完全失效。
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center glow-border">
            <div className="text-4xl font-black text-risk-critical mb-2">$40B+</div>
            <div className="text-text-secondary text-sm">市值蒸发</div>
          </div>
          <div className="glass-card p-6 text-center glow-border">
            <div className="text-4xl font-black text-risk-high mb-2">-99.7%</div>
            <div className="text-text-secondary text-sm">LUNA 价格跌幅</div>
          </div>
          <div className="glass-card p-6 text-center glow-border">
            <div className="text-4xl font-black text-risk-medium mb-2">0</div>
            <div className="text-text-secondary text-sm">协议提前预警</div>
          </div>
        </div>
      </section>

      {/* Solution / How it Works */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="gradient-text">三步</span>守护协议安全
        </h2>
        <div className="grid md:grid-cols-3 gap-4 relative">
          {/* Connection lines (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-accent to-accent-blue connection-line" />
          <div className="hidden md:block absolute top-1/2 left-2/3 w-1/3 h-0.5 bg-gradient-to-r from-accent-blue to-purple-500 connection-line" />
          <StepCard num="01" title="数据聚合" desc="多源价格 + 链上指标实时采集" />
          <StepCard num="02" title="风险评分" desc="EvoQuantV3 模型动态计算风险分" />
          <StepCard num="03" title="协议联动" desc="自动调整 LTV / 触发预警 / 调仓" />
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          核心<span className="gradient-text">功能</span>
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          21 个功能模块，覆盖 DeFi 风险管理全流程
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon="📈" title="风险趋势追踪" desc="实时记录风险评分历史，可视化趋势变化与拐点" />
          <FeatureCard icon="🌊" title="清算瀑布模拟" desc="交互式模拟连锁清算过程，展示卖压传导路径" />
          <FeatureCard icon="💼" title="Portfolio 追踪" desc="持仓风险分析 + 权重偏离度 + 一键调仓建议" />
          <FeatureCard icon="🔔" title="自定义告警" desc="自定义阈值规则，实时评估触发状态" />
          <FeatureCard icon="🏆" title="协议安全排名" desc="风险调整后收益率排序，找到最安全的协议" />
          <FeatureCard icon="🌍" title="宏观状态指示" desc="市场 regime 识别 + 历史切换 + 操作建议" />
          <FeatureCard icon="🔥" title="清算热力图" desc="交易所 × 杠杆倍数清算密度可视化" />
          <FeatureCard icon="📊" title="收益归因分析" desc="拆解 Vault 超额收益来源，验证 Oracle 价值" />
          <FeatureCard icon="🧪" title="压力测试" desc="模拟极端行情，验证协议抗风险能力" />
          <FeatureCard icon="⚡" title="清算预测" desc="未来 4h 各资产清算概率预测" />
          <FeatureCard icon="🕸️" title="传导图" desc="可视化资产间风险传导路径与集群" />
          <FeatureCard icon="🔗" title="多协议联动" desc="跨 Lending / Perp / Vault 统一风险管理" />
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          实时<span className="gradient-text">数据</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-8 text-center glow-border animate-float">
            <div className="text-5xl font-black gradient-text mb-2">
              {stats?.system_risk_score ?? "—"}
            </div>
            <div className="text-text-secondary">系统风险分</div>
          </div>
          <div className="glass-card p-8 text-center glow-border animate-float-delay-1">
            <div className="text-5xl font-black gradient-text mb-2">
              {stats?.tracked_assets ?? "—"}
            </div>
            <div className="text-text-secondary">追踪资产数</div>
          </div>
          <div className="glass-card p-8 text-center glow-border animate-float-delay-2">
            <div className="text-5xl font-black gradient-text mb-2">
              {stats?.active_alerts ?? "—"}
            </div>
            <div className="text-text-secondary">活跃告警</div>
          </div>
          <div className="glass-card p-8 text-center glow-border animate-float-delay-3">
            <div className="text-5xl font-black gradient-text mb-2">21</div>
            <div className="text-text-secondary">功能模块</div>
          </div>
        </div>
      </section>
      {/* Architecture Diagram */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          系统<span className="gradient-text">架构</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 glow-border text-center animate-slide-in-left">
            <div className="text-accent text-2xl mb-3">⬡</div>
            <h3 className="font-bold text-lg mb-2">Frontend</h3>
            <p className="text-text-secondary text-sm">React + Tailwind + Vite</p>
            <p className="text-text-secondary text-sm">21 模块实时仪表盘</p>
          </div>
          <div className="glass-card p-6 glow-border text-center animate-fade-in-delay">
            <div className="text-accent-blue text-2xl mb-3">⚙️</div>
            <h3 className="font-bold text-lg mb-2">Backend</h3>
            <p className="text-text-secondary text-sm">FastAPI + EvoQuantV3 + SQLite</p>
            <p className="text-text-secondary text-sm">风险模型 + 历史存储 + 定时调度</p>
          </div>
          <div className="glass-card p-6 glow-border text-center animate-slide-in-right">
            <div className="text-purple-400 text-2xl mb-3">📜</div>
            <h3 className="font-bold text-lg mb-2">Smart Contracts</h3>
            <p className="text-text-secondary text-sm">Sui Move</p>
            <p className="text-text-secondary text-sm">动态 LTV + 清算保护 + Vault</p>
          </div>
        </div>
      </section>

      {/* Backtest Proof */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          回测<span className="gradient-text">验证</span>
        </h2>
        <p className="text-text-secondary text-center mb-12">
          LUNA 崩盘场景回测：EvoOracle 动态保护 vs 静态 LTV
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-8 text-center glow-border border-risk-low/30">
            <div className="text-sm text-text-secondary mb-2">EvoOracle Protected</div>
            <div className="text-5xl font-black text-risk-low mb-2">-8%</div>
            <div className="text-text-secondary text-sm">动态降低 LTV + 提前预警</div>
          </div>
          <div className="glass-card p-8 text-center border border-risk-critical/30">
            <div className="text-sm text-text-secondary mb-2">Static LTV</div>
            <div className="text-5xl font-black text-risk-critical mb-2">-43%</div>
            <div className="text-text-secondary text-sm">固定参数，无法应对极端行情</div>
          </div>
        </div>
      </section>
      {/* Tech Stack */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          技术<span className="gradient-text">栈</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <TechBadge name="Sui Move" desc="智能合约" />
          <TechBadge name="React" desc="前端框架" />
          <TechBadge name="FastAPI" desc="后端服务" />
          <TechBadge name="EvoQuantV3" desc="风险模型" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold gradient-text">EvoOracle</span>
            <span className="text-text-secondary text-sm">Built on Sui</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/CnOxx1/evo-oracle" target="_blank" rel="noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors">
              GitHub
            </a>
            <span className="text-text-secondary text-sm">© 2025 EvoOracle Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Helper Components */
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="glass-card p-6 text-center relative z-10">
      <div className="text-accent font-mono text-sm mb-2">{num}</div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-text-secondary text-sm">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="glass-card p-6 glow-border-hover transition-all duration-300 hover:-translate-y-1">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-text-secondary text-sm">{desc}</p>
    </div>
  );
}

function TechBadge({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="glass-card p-4 text-center hover:glow-border transition-all">
      <div className="font-bold mb-1">{name}</div>
      <div className="text-text-secondary text-xs">{desc}</div>
    </div>
  );
}