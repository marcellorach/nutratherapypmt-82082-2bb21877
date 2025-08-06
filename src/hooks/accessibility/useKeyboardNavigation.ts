import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  disabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onSpace,
    onTab,
    disabled = false
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        break;
      case ' ':
        event.preventDefault();
        onSpace?.();
        break;
      case 'Tab':
        onTab?.(event.shiftKey ? 'backward' : 'forward');
        break;
    }
  }, [disabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onSpace, onTab]);

  useEffect(() => {
    if (!disabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, disabled]);

  return { handleKeyDown };
};

// Hook for managing focus within a container
export const useFocusManagement = () => {
  const containerRef = useRef<HTMLElement>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
    ) as HTMLElement[];
  }, []);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    elements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    elements[elements.length - 1]?.focus();
  }, [getFocusableElements]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex]?.focus();
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    const previousIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    elements[previousIndex]?.focus();
  }, [getFocusableElements]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
};

// Hook for managing roving tabindex
export const useRovingTabIndex = (isActive: boolean = false) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.tabIndex = isActive ? 0 : -1;
      if (isActive) {
        elementRef.current.focus();
      }
    }
  }, [isActive]);

  return elementRef;
};

// Hook for announcing content to screen readers
export const useAnnouncer = () => {
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.textContent = '';
    
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const announcePolitely = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceAssertively = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  useEffect(() => {
    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  return {
    announce,
    announcePolitely,
    announceAssertively
  };
};