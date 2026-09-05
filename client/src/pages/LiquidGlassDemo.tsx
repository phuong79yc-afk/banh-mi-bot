import LiquidGlass from '../components/LiquidGlass';

/**
 * Demo page showcasing the LiquidGlass component with various configurations
 */
export default function LiquidGlassDemo() {
  return (
    <div className="min-h-screen w-full relative overflow-auto">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1551384963-cccb0b7ed94b?q=80&w=3247&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 space-y-16">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">Liquid Glass Effect</h1>
          <p className="text-xl opacity-90">
            Scroll to see multiple glass effects with chromatic aberration
          </p>
        </div>

        {/* Example 1: Default Fixed Center */}
        <LiquidGlass>
          <div className="flex items-center justify-center h-full text-white text-2xl font-semibold">
            Fixed Center Glass
          </div>
        </LiquidGlass>

        {/* Example 2: Custom Positioned */}
        <div className="flex justify-center">
          <LiquidGlass
            position="relative"
            width="400px"
            height="200px"
            left="0"
            top="0"
            transform="none"
          >
            <div className="flex flex-col items-center justify-center h-full text-white p-6">
              <h2 className="text-2xl font-bold mb-2">Relative Positioned</h2>
              <p className="text-sm opacity-80 text-center">
                Custom size and positioning
              </p>
            </div>
          </LiquidGlass>
        </div>

        {/* Example 3: Card Style */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <LiquidGlass
            position="relative"
            width="100%"
            height="250px"
            left="0"
            top="0"
            transform="none"
            glassFrost={0.25}
          >
            <div className="flex flex-col items-center justify-center h-full text-white p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">Creative Design</h3>
              <p className="text-sm opacity-80 text-center">
                Glassmorphism with chromatic aberration
              </p>
            </div>
          </LiquidGlass>

          <LiquidGlass
            position="relative"
            width="100%"
            height="250px"
            left="0"
            top="0"
            transform="none"
            glassSaturation={1.6}
          >
            <div className="flex flex-col items-center justify-center h-full text-white p-6">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Enhanced Saturation</h3>
              <p className="text-sm opacity-80 text-center">
                More vivid colors through the glass
              </p>
            </div>
          </LiquidGlass>
        </div>

        {/* Example 4: Wide Panel */}
        <div className="max-w-6xl mx-auto">
          <LiquidGlass
            position="relative"
            width="100%"
            height="180px"
            left="0"
            top="0"
            transform="none"
            glassFrost={0.22}
          >
            <div className="flex items-center justify-between h-full text-white px-8">
              <div>
                <h3 className="text-2xl font-bold mb-2">Wide Glass Panel</h3>
                <p className="text-sm opacity-80">
                  Perfect for headers and banners
                </p>
              </div>
              <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all">
                Learn More
              </button>
            </div>
          </LiquidGlass>
        </div>

        {/* Example 5: Compact Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          {['React', 'TypeScript', 'Tailwind', 'Vite'].map((tech) => (
            <LiquidGlass
              key={tech}
              position="relative"
              width="140px"
              height="60px"
              left="0"
              top="0"
              transform="none"
              glassFrost={0.2}
            >
              <div className="flex items-center justify-center h-full text-white font-semibold">
                {tech}
              </div>
            </LiquidGlass>
          ))}
        </div>

        {/* Example 6: Content Card */}
        <div className="max-w-2xl mx-auto">
          <LiquidGlass
            position="relative"
            width="100%"
            height="auto"
            left="0"
            top="0"
            transform="none"
            glassFrost={0.18}
          >
            <div className="text-white p-8 space-y-4">
              <h2 className="text-3xl font-bold">About This Effect</h2>
              <p className="opacity-90 leading-relaxed">
                The liquid glass effect combines glassmorphism with chromatic aberration,
                creating a stunning visual effect that separates RGB channels to simulate
                the refraction of light through glass.
              </p>
              <ul className="space-y-2 opacity-80">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Fully responsive design
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Customizable properties
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  SVG filter-based effects
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Cross-browser compatible
                </li>
              </ul>
            </div>
          </LiquidGlass>
        </div>

        {/* Spacer for scrolling */}
        <div className="h-32" />
      </div>
    </div>
  );
}
