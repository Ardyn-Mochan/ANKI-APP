
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Upload, Download, RotateCcw, Sparkles } from 'lucide-react';
import { Card } from './types';

// Helper: Header Component
const Header: React.FC = () => (
  <header className="text-center mb-8">
    <div className="flex items-center justify-center gap-3 mb-2">
      <Brain size={48} className="text-cyan-400" />
      <h1 className="text-5xl font-bold text-violet-200">NeuroCards</h1>
      <Sparkles size={32} className="text-pink-400" />
    </div>
    <p className="text-lg text-violet-200">Psychology-Enhanced Learning System</p>
  </header>
);

// Helper: Input Screen Component
interface InputScreenProps {
  input: string;
  setInput: (value: string) => void;
  onGenerate: () => void;
  parsedCardCount: number;
}

const InputScreen: React.FC<InputScreenProps> = ({ input, setInput, onGenerate, parsedCardCount }) => {
  return (
    <div className="w-full max-w-2xl bg-black/20 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Upload size={24} className="text-cyan-400" />
          <h2 className="text-xl font-semibold text-white ml-3">Create Your Cards</h2>
        </div>
        <p className="text-violet-200 text-sm mb-4">
          Use any of these formats (one card per line):
        </p>
        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
          <p className="text-cyan-300">• Question::Answer</p>
          <p className="text-cyan-300">• Question|Answer</p>
          <p className="text-cyan-300">• Question&nbsp;&nbsp;&nbsp;[TAB]Answer</p>
          <p className="text-cyan-300">• Question&nbsp;&nbsp;Answer (2+ spaces)</p>
        </div>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="être    to be&#10;avoir   to have&#10;aller   to go&#10;faire   to do / to make&#10;pouvoir can / to be able to"
        className="w-full h-64 bg-black/30 text-white rounded-lg p-4 border-2 border-purple-500/50 font-mono text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-300 resize-none"
      />

      <button
        onClick={onGenerate}
        disabled={!input.trim()}
        className="w-full mt-6 py-3 px-4 bg-pink-600 text-white font-bold rounded-lg text-lg shadow-lg hover:bg-pink-700 transition-transform transform hover:scale-105 disabled:bg-pink-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Cards ✨ ({parsedCardCount} detected)
      </button>
    </div>
  );
};

// Helper: Flashcard Component
interface FlashcardProps {
    card: Card;
    cardNumber: number;
    totalCards: number;
    onNext: () => void;
    onPrev: () => void;
}

const SWIPE_THRESHOLD = 80;

const Flashcard: React.FC<FlashcardProps> = ({ card, cardNumber, totalCards, onNext, onPrev }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const gestureState = useRef({
        isDragging: false,
        hasMoved: false,
        startX: 0,
        currentX: 0,
        lastClientX: 0,
    });

    useEffect(() => {
        setIsFlipped(false);
        const node = cardRef.current;
        if (node) {
            // Initial state for entry animation
            node.style.transition = 'none';
            // Start slightly smaller and lower for a pop-up effect
            node.style.transform = 'scale(0.85) translateY(50px) rotateY(0deg)';
            node.style.opacity = '0';
            
            // Force reflow
            node.getBoundingClientRect();

            requestAnimationFrame(() => {
                // Springy entry animation
                node.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out';
                node.style.transform = 'scale(1) translateY(0) rotateY(0deg)';
                node.style.opacity = '1';
            });
        }
    }, [card]);

    const handlePointerDown = useCallback((clientX: number) => {
        gestureState.current = {
            isDragging: true,
            hasMoved: false,
            startX: clientX,
            currentX: 0,
            lastClientX: clientX,
        };
        if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.1s ease-out';
            cardRef.current.style.cursor = 'grabbing';
            // Tactile feedback: scale down slightly on press
            const currentRotateY = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
            cardRef.current.style.transform = `${currentRotateY} scale(0.97)`;
        }
    }, [isFlipped]);

    const handlePointerMove = useCallback((clientX: number) => {
        if (!gestureState.current.isDragging) return;
        
        const deltaX = clientX - gestureState.current.startX;
        if (!gestureState.current.hasMoved && Math.abs(deltaX) > 5) {
            gestureState.current.hasMoved = true;
        }
        gestureState.current.currentX = deltaX;
        gestureState.current.lastClientX = clientX;

        if (cardRef.current) {
            const rotateY = isFlipped ? 'rotateY(180deg)' : '';
            // Add dynamic rotation and maintain the "pressed" scale
            cardRef.current.style.transform = `${rotateY} translateX(${deltaX}px) rotateZ(${deltaX / 20}deg) scale(0.97)`;
        }
    }, [isFlipped]);

    const handlePointerUp = useCallback(() => {
        if (!gestureState.current.isDragging) return;

        const { hasMoved, currentX, lastClientX } = gestureState.current;
        gestureState.current.isDragging = false;

        const node = cardRef.current;
        if (!node) return;

        node.style.cursor = 'grab';
        
        // Let the main CSS class transition handle animations from here.
        node.style.transition = '';

        // Check for a successful swipe
        if (hasMoved && Math.abs(currentX) > SWIPE_THRESHOLD) {
            const transitionDuration = 300;
            node.style.transition = `transform ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out`;
            
            const rotateY = isFlipped ? 'rotateY(180deg)' : '';
            const direction = currentX > 0 ? 1 : -1;
            
            // Throw it further with more rotation and a slight scale down
            node.style.transform = `${rotateY} translateX(${direction * 1000}px) rotateZ(${direction * 45}deg) scale(0.8)`;
            node.style.opacity = '0';

            setTimeout(() => {
                // Swipe Left (< 0) -> Next Card
                // Swipe Right (> 0) -> Prev Card
                if (direction > 0) {
                    onPrev();
                } else {
                    onNext();
                }
            }, transitionDuration - 50);

        } else { // Not a swipe, so it's a tap/click
            // IMPORTANT: Remove all inline styles to let Tailwind CSS classes take full control
            // This ensures the scale resets to 1 and the flip animation uses the CSS transition
            node.style.removeProperty('transform');
            node.style.removeProperty('transition');
            
            // Determine the click action based on position
            const rect = node.getBoundingClientRect();
            const x = lastClientX - rect.left;
            const cardWidth = rect.width;

            if (x < cardWidth * 0.25) {
                onPrev();
            } else if (x > cardWidth * 0.75) {
                onNext();
            } else {
                setIsFlipped(f => !f);
            }
        }
    }, [isFlipped, onNext, onPrev]);
    
    useEffect(() => {
        const node = cardRef.current;
        if (!node) return;

        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            handlePointerDown(e.clientX);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, { once: true });
        };
        const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX);
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            handlePointerUp();
        };
        
        const onTouchStart = (e: TouchEvent) => {
            handlePointerDown(e.touches[0].clientX);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', onTouchEnd, { once: true });
        };
        const onTouchMove = (e: TouchEvent) => handlePointerMove(e.touches[0].clientX);
        const onTouchEnd = () => {
            window.removeEventListener('touchmove', onTouchMove);
            handlePointerUp();
        };

        node.addEventListener('mousedown', onMouseDown);
        node.addEventListener('touchstart', onTouchStart, { passive: true });
        
        return () => {
            node.removeEventListener('mousedown', onMouseDown);
            node.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handlePointerDown, handlePointerMove, handlePointerUp]);

    return (
        <div className="w-full h-full [perspective:1000px]">
            <div
                ref={cardRef}
                className={`relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* Front Side */}
                <div className="absolute w-full h-full rounded-2xl p-8 flex flex-col bg-indigo-500/90 shadow-2xl [backface-visibility:hidden] select-none cursor-grab">
                    <p className="text-center text-violet-200 text-sm">Card {cardNumber} of {totalCards}</p>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <p className="text-cyan-300 text-sm font-semibold mb-4 uppercase tracking-widest">Question</p>
                        <p className="text-white text-4xl font-bold text-center">{card.front}</p>
                    </div>
                    <div className="flex justify-between items-center text-violet-200 text-sm">
                        <span>← Prev</span>
                        <span>Click to Flip</span>
                        <span>Next →</span>
                    </div>
                </div>

                {/* Back Side */}
                <div className="absolute w-full h-full rounded-2xl p-8 flex flex-col bg-pink-600/90 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] select-none cursor-grab">
                    <p className="text-center text-violet-200 text-sm">Card {cardNumber} of {totalCards}</p>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <p className="text-cyan-300 text-sm font-semibold mb-4 uppercase tracking-widest">Answer</p>
                        <p className="text-white text-4xl font-bold text-center">{card.back}</p>
                    </div>
                    <div className="flex justify-between items-center text-violet-200 text-sm">
                        <span>← Prev</span>
                        <span>Click to Flip</span>
                        <span>Next →</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Helper: Study Screen Component
interface StudyScreenProps {
  cards: Card[];
  currentCard: number;
  setCurrentCard: (index: number) => void;
  onEdit: () => void;
  onExport: () => void;
}

const StudyScreen: React.FC<StudyScreenProps> = ({ cards, currentCard, setCurrentCard, onEdit, onExport }) => {
    
    const nextCard = useCallback(() => {
        setCurrentCard((prev) => (prev + 1) % cards.length);
    }, [cards.length, setCurrentCard]);

    const prevCard = useCallback(() => {
        setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
    }, [cards.length, setCurrentCard]);
    
    const restartDeck = () => {
        setCurrentCard(0);
    };

    return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="flex justify-center gap-4 mb-6 w-full">
            <button onClick={onEdit} className="py-2 px-5 bg-black/20 text-white rounded-lg hover:bg-black/40 transition">
                ← Edit Cards
            </button>
            <button onClick={onExport} className="py-2 px-5 bg-emerald-500 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-600 transition shadow-lg">
                <Download size={16} /> Export to Anki
            </button>
        </div>
        
        <div className="relative w-full h-[500px] mb-6">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-2xl blur-2xl z-0"></div>
            <Flashcard 
                card={cards[currentCard]}
                cardNumber={currentCard + 1}
                totalCards={cards.length}
                onNext={nextCard}
                onPrev={prevCard}
            />
        </div>

        <button onClick={restartDeck} className="py-2 px-5 bg-black/20 text-white rounded-lg flex items-center gap-2 hover:bg-black/40 transition">
            <RotateCcw size={16} /> Restart Deck
        </button>

        <div className="mt-6 bg-black/20 rounded-lg p-4 text-center text-violet-200 text-sm w-full">
            <p>💡 <span className="font-bold">Pro Tip:</span> Swipe Left for Next, Swipe Right for Previous.</p>
        </div>
    </div>
    );
};

// Main App Component
const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [mode, setMode] = useState<'input' | 'study'>('input');

  const parseInput = useCallback((text: string): Card[] => {
    const lines = text.trim().split('\n');
    const parsed: Card[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      let parts: string[] = [];
      if (trimmedLine.includes('::')) {
        parts = trimmedLine.split('::').map(s => s.trim());
      } else if (trimmedLine.includes('|')) {
        parts = trimmedLine.split('|').map(s => s.trim());
      } else if (trimmedLine.includes('\t')) {
        parts = trimmedLine.split(/\t+/).map(s => s.trim());
      } else if (/\s{2,}/.test(trimmedLine)) {
        parts = trimmedLine.split(/\s{2,}/).map(s => s.trim());
      }

      if (parts.length >= 2 && parts[0] && parts[1]) {
        parsed.push({ front: parts[0], back: parts.slice(1).join(' ') });
      }
    }
    return parsed;
  }, []);

  const handleGenerate = () => {
    const parsed = parseInput(input);
    if (parsed.length > 0) {
      setCards(parsed);
      setMode('study');
      setCurrentCard(0);
    } else {
      alert('Error: No valid cards found. Please check your input format.');
    }
  };

  const exportToAnki = () => {
    const ankiFormat = cards.map(card => `${card.front}\t${card.back}`).join('\n');
    const blob = new Blob([ankiFormat], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NeuroCards_export.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 bg-gradient-to-br from-violet-900 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-4 selection:bg-pink-500 selection:text-white">
      <main className="w-full flex flex-col items-center">
        <Header />
        {mode === 'input' ? (
          <InputScreen 
            input={input}
            setInput={setInput}
            onGenerate={handleGenerate}
            parsedCardCount={parseInput(input).length}
          />
        ) : (
          <StudyScreen 
            cards={cards}
            currentCard={currentCard}
            setCurrentCard={setCurrentCard}
            onEdit={() => setMode('input')}
            onExport={exportToAnki}
          />
        )}
      </main>
    </div>
  );
};

export default App;
