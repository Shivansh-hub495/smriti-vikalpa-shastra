import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface TiltedScrollItem {
  id: string;
  text: string;
  highlight?: string;
}

interface TiltedScrollProps {
  items?: TiltedScrollItem[];
  className?: string;
}

export function TiltedScroll({ 
  items = defaultItems,
  className 
}: TiltedScrollProps) {
  // Duplicate items for seamless scrolling
  const duplicatedItems = [...items, ...items];

  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <div className="relative w-full max-w-4xl overflow-hidden [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_5rem),linear-gradient(to_left,transparent,black_5rem),linear-gradient(to_bottom,transparent,black_5rem),linear-gradient(to_top,transparent,black_5rem)]">
        <div className="grid h-[500px] w-full gap-5 animate-skew-scroll grid-cols-1">
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="group flex items-start gap-4 cursor-pointer rounded-xl border border-purple-100/40 dark:border-purple-900/40 bg-gradient-to-b from-white/80 to-purple-50/80 dark:from-gray-800/80 dark:to-purple-900/20 p-6 shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <CheckCircle2 className="h-7 w-7 mt-0.5 stroke-purple-500 dark:stroke-purple-400 transition-colors group-hover:stroke-purple-600 dark:group-hover:stroke-purple-300 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  {item.highlight}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-200">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const defaultItems: TiltedScrollItem[] = [
  { 
    id: "1", 
    text: "AI-powered spaced repetition algorithm adapts to your learning pace",
    highlight: "Advanced AI"
  },
  { 
    id: "2", 
    text: "Set and achieve your learning goals with detailed progress tracking",
    highlight: "Progress Analytics"
  },
  { 
    id: "3", 
    text: "Specialized decks for CA, NEET, UPSC, and other competitive exams",
    highlight: "Exam Ready"
  },
  { 
    id: "4", 
    text: "Create flashcards with text, images, and multimedia content",
    highlight: "Multimedia Support"
  },
  { 
    id: "5", 
    text: "Share decks with friends and study together in groups",
    highlight: "Team Study"
  },
  { 
    id: "6", 
    text: "Your data is encrypted and stored securely with enterprise-grade security",
    highlight: "Bank-level Security"
  },
]