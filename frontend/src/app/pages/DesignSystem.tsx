import {
  Search,
  AlertTriangle,
  Trophy,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export function DesignSystem() {
  //const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-16 pb-20">
      <header className="border-b border-neutral-900 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Design System
        </h1>
        <p className="text-neutral-500 mt-2">
          Core primitives and components for Chess42. Built with Tailwind CSS.
        </p>
      </header>

      {/* General Usage Rules */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          General Usage Rules
        </h2>
        <div className="bg-[#050505] border border-neutral-900 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">1. Dark Mode Only</h3>
            <p className="text-sm text-neutral-400">
              All components must use the ultra-dark color palette. Base
              background is{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-blue-400">
                #050505
              </code>
              , with pure black for elevated surfaces.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">2. Accent Usage</h3>
            <p className="text-sm text-neutral-400">
              Use blue (
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-blue-400">
                blue-600/blue-500
              </code>
              ) for primary actions and purple (
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-purple-400">
                purple-500
              </code>
              ) for premium features or highlights. Never mix both in the same
              component.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">
              3. Borders & Separation
            </h3>
            <p className="text-sm text-neutral-400">
              Default borders use{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                border-neutral-900
              </code>{" "}
              or{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                border-neutral-800
              </code>
              . Hover states should lighten to{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                border-neutral-700
              </code>
              .
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">
              4. Spacing Consistency
            </h3>
            <p className="text-sm text-neutral-400">
              Use Tailwind's spacing scale:{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                p-4/p-6
              </code>{" "}
              for cards,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                gap-4/gap-6
              </code>{" "}
              for grids,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                space-y-2/space-y-4
              </code>{" "}
              for vertical stacks.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">5. Text Hierarchy</h3>
            <p className="text-sm text-neutral-400">
              White (
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                text-white
              </code>
              ) for headings,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                text-neutral-200
              </code>{" "}
              for body,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                text-neutral-400
              </code>{" "}
              for secondary,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                text-neutral-500/600
              </code>{" "}
              for labels.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">
              6. Rounded Corners
            </h3>
            <p className="text-sm text-neutral-400">
              Use{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                rounded-lg
              </code>{" "}
              for buttons and inputs,{" "}
              <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-neutral-400">
                rounded-xl
              </code>{" "}
              for cards and large surfaces.
            </p>
          </div>
        </div>
      </section>

      {/* Responsive Breakpoints */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Responsive Breakpoints
        </h2>
        <p className="text-sm text-neutral-400">
          Tailwind CSS provides five default breakpoints. All breakpoints use a{" "}
          <strong className="text-white">mobile-first</strong> approach —
          classes without prefixes apply to all screen sizes, and prefixed
          classes override them at larger screens.
        </p>

        <div className="space-y-3">
          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Smartphone className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">
                  Default (Mobile)
                </div>
                <div className="text-xs text-neutral-500">0px - 639px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                No prefix needed. Base styles apply here.
              </p>
            </div>
          </div>

          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Tablet className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">sm:</div>
                <div className="text-xs text-neutral-500">≥640px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Small devices (landscape phones, small tablets)
              </p>
              <code className="text-xs text-blue-400 block mt-1">
                sm:grid-cols-2
              </code>
            </div>
          </div>

          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Tablet className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">md:</div>
                <div className="text-xs text-neutral-500">≥768px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Medium devices (tablets)
              </p>
              <code className="text-xs text-blue-400 block mt-1">
                md:grid-cols-3
              </code>
            </div>
          </div>

          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Monitor className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">lg:</div>
                <div className="text-xs text-neutral-500">≥1024px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Large devices (desktops)
              </p>
              <code className="text-xs text-blue-400 block mt-1">
                lg:grid-cols-4
              </code>
            </div>
          </div>

          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Monitor className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">xl:</div>
                <div className="text-xs text-neutral-500">≥1280px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Extra large devices (large desktops)
              </p>
              <code className="text-xs text-blue-400 block mt-1">
                xl:max-w-7xl
              </code>
            </div>
          </div>

          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-5 flex items-center gap-4">
            <Monitor className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-white">2xl:</div>
                <div className="text-xs text-neutral-500">≥1536px</div>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                2X Extra large devices (ultra-wide screens)
              </p>
              <code className="text-xs text-blue-400 block mt-1">2xl:px-0</code>
            </div>
          </div>
        </div>

        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">
            Usage Example
          </h3>
          <code className="text-xs text-neutral-300 block bg-black p-3 rounded-lg border border-neutral-800">
            {`<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">`}
          </code>
          <p className="text-xs text-neutral-400 mt-2">
            This will create: 1 column on mobile, 2 on small tablets, 3 on
            tablets, and 4 on desktops.
          </p>
        </div>
      </section>

      {/* 1. Colors */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Colors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-black border border-neutral-800" />
            <div className="text-sm font-medium text-white">
              Background Base
            </div>
            <div className="text-xs text-neutral-500 font-mono">bg-black</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-[#050505] border border-neutral-800" />
            <div className="text-sm font-medium text-white">
              Surface Default
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-[#050505]
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-[#0a0a0a] border border-neutral-800" />
            <div className="text-sm font-medium text-white">
              Surface Elevated
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-[#0a0a0a]
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-neutral-900 border border-neutral-800" />
            <div className="text-sm font-medium text-white">
              Borders / Hover
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-neutral-900
            </div>
          </div>

          {/* Brand Colors */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-blue-600" />
            <div className="text-sm font-medium text-white">Primary Blue</div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-blue-600
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-purple-500" />
            <div className="text-sm font-medium text-white">Accent Purple</div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-purple-500
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-green-500" />
            <div className="text-sm font-medium text-white">Success Green</div>
            <div className="text-xs text-neutral-500 font-mono">
              bg-green-500
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-red-500" />
            <div className="text-sm font-medium text-white">Danger Red</div>
            <div className="text-xs text-neutral-500 font-mono">bg-red-500</div>
          </div>
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Typography
        </h2>
        <div className="space-y-6 bg-[#050505] border border-neutral-900 rounded-xl p-6">
          <div className="flex items-baseline gap-8 border-b border-neutral-900 pb-4">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-3xl
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Heading 1
            </h1>
          </div>
          <div className="flex items-baseline gap-8 border-b border-neutral-900 pb-4">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-2xl
            </div>
            <h2 className="text-2xl font-bold text-white">Heading 2</h2>
          </div>
          <div className="flex items-baseline gap-8 border-b border-neutral-900 pb-4">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-xl
            </div>
            <h3 className="text-xl font-semibold text-white">Heading 3</h3>
          </div>
          <div className="flex items-baseline gap-8 border-b border-neutral-900 pb-4">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-base
            </div>
            <p className="text-base text-neutral-200">
              Body text. Lorem ipsum dolor sit amet, consectetur adipiscing
              elit.
            </p>
          </div>
          <div className="flex items-baseline gap-8 border-b border-neutral-900 pb-4">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-sm
            </div>
            <p className="text-sm text-neutral-400">
              Small text. Used for secondary information and descriptions.
            </p>
          </div>
          <div className="flex items-baseline gap-8">
            <div className="w-24 text-xs text-neutral-500 font-mono">
              text-xs
            </div>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
              Eyebrow text / Labels
            </p>
          </div>
        </div>
      </section>

      {/* 3. Buttons */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
            Primary Action
          </button>

          <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors">
            Secondary Action
          </button>

          <button className="bg-transparent hover:bg-neutral-900 text-neutral-300 font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors">
            Outline
          </button>

          <button className="bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
            Ghost Button
          </button>

          <button className="bg-red-950/30 hover:bg-red-900/40 text-red-500 font-medium py-2.5 px-6 rounded-lg border border-red-900/30 transition-colors flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger
          </button>
        </div>
      </section>

      {/* 4. Inputs */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Inputs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Standard Input
              </label>
              <input
                type="text"
                placeholder="Placeholder..."
                className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                With Icon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-neutral-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Disabled Input
              </label>
              <input
                type="text"
                disabled
                value="Cannot edit this"
                className="w-full bg-neutral-900/50 border border-neutral-900 rounded-lg py-2.5 px-4 text-neutral-600 cursor-not-allowed text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Error State
              </label>
              <input
                type="text"
                defaultValue="Invalid input"
                className="w-full bg-black border border-red-500/50 rounded-lg py-2.5 px-4 text-red-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
              />
              <p className="text-xs text-red-500">This field is required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cards */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Cards
        </h2>
        <p className="text-sm text-neutral-400">
          Cards are versatile containers used throughout the application. Always
          use the{" "}
          <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-blue-400">
            Card
          </code>{" "}
          component from{" "}
          <code className="text-neutral-500">@/components/ui/card</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Card */}
          <Card className="bg-[#050505] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Basic Card</CardTitle>
              <CardDescription className="text-neutral-500">
                Simple card with header and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-400">
                This is the most basic card structure. Use it for static content
                or information displays.
              </p>
            </CardContent>
          </Card>

          {/* Card with Icon */}
          <Card className="bg-[#050505] border-neutral-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-white">Card with Icon</CardTitle>
                  <CardDescription className="text-neutral-500">
                    Enhanced visual hierarchy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-400">
                Add icons to cards to improve scannability and visual interest.
              </p>
            </CardContent>
          </Card>

          {/* Interactive Card */}
          <Card className="bg-black border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white">Interactive Card</CardTitle>
              <CardDescription className="text-neutral-500">
                Hover to see the effect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-400">
                Interactive cards use hover states to signal clickability. Add
                cursor-pointer and border transitions.
              </p>
            </CardContent>
          </Card>

          {/* Card with Footer */}
          <Card className="bg-[#050505] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Card with Footer</CardTitle>
              <CardDescription className="text-neutral-500">
                Actions or metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-400">
                Use footers for actions, timestamps, or additional metadata.
              </p>
            </CardContent>
            <CardFooter className="border-t border-neutral-900">
              <button className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
                View Details
              </button>
            </CardFooter>
          </Card>
        </div>

        {/* Full-width Card Example */}
        <Card className="bg-[#050505] border-neutral-900">
          <CardHeader>
            <CardTitle className="text-white">Stat Card Example</CardTitle>
            <CardDescription className="text-neutral-500">
              Displaying metrics and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">1,247</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">
                  Total Games
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-500">892</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">
                  Wins
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-purple-500">1,850</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">
                  Rating
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. Modals */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-neutral-900 pb-2">
          Modals
        </h2>
        <p className="text-sm text-neutral-400">
          Modals use the{" "}
          <code className="px-2 py-0.5 bg-black border border-neutral-800 rounded text-blue-400">
            Dialog
          </code>{" "}
          component from{" "}
          <code className="text-neutral-500">@/components/ui/dialog</code>. They
          overlay the page with a backdrop and center the content.
        </p>

        {/* Modal Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simple Modal */}
          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-2">Basic Modal</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Simple confirmation or information dialog.
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
                  Open Basic Modal
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a0a0a] border-neutral-800">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Confirm Action
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Are you sure you want to proceed? This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button className="bg-transparent hover:bg-neutral-900 text-neutral-300 font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors">
                    Cancel
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
                    Confirm
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Modal with Form */}
          <div className="bg-[#050505] border border-neutral-900 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-2">Form Modal</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Modal containing form inputs.
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
                  Open Form Modal
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a0a0a] border-neutral-800">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create Tournament
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Fill in the details to create a new tournament.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400">
                      Tournament Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name..."
                      className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400">
                      Max Players
                    </label>
                    <input
                      type="number"
                      placeholder="8"
                      className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <button className="bg-transparent hover:bg-neutral-900 text-neutral-300 font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors">
                    Cancel
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
                    Create
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Modal Code Example */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">
            Modal Code Structure
          </h3>
          <code className="text-xs text-neutral-300 block bg-black p-4 rounded-lg border border-neutral-800 whitespace-pre-wrap">
            {`<Dialog>
  <DialogTrigger asChild>
    <button>Open Modal</button>
  </DialogTrigger>
  <DialogContent className="bg-[#0a0a0a] border-neutral-800">
    <DialogHeader>
      <DialogTitle className="text-white">Title</DialogTitle>
      <DialogDescription className="text-neutral-400">
        Description text
      </DialogDescription>
    </DialogHeader>
    {/* Modal content */}
    <DialogFooter>
      <button>Cancel</button>
      <button>Confirm</button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
          </code>
        </div>
      </section>
    </div>
  );
}
