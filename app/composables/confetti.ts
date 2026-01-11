import confettiLib from 'canvas-confetti';

export function useConfetti() {
  function confetti() {
    if (typeof window === 'undefined')
      return;

    confettiLib({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  return {
    confetti,
  };
}
