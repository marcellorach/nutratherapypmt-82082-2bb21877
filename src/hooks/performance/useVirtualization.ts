import { useMemo, useState, useEffect, useCallback } from 'react';

/**
 * Hook para virtualização de listas grandes
 */
export const useVirtualization = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

/**
 * Hook para carregamento progressivo de dados
 */
export const useInfiniteScroll = <T>(
  fetchMore: () => Promise<T[]>,
  threshold: number = 100
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (
      scrollHeight - scrollTop <= clientHeight + threshold &&
      !isLoading &&
      hasMore
    ) {
      setIsLoading(true);
      
      try {
        const newItems = await fetchMore();
        if (newItems.length === 0) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading more items:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchMore, threshold, isLoading, hasMore]);

  return {
    handleScroll,
    isLoading,
    hasMore,
    setHasMore,
  };
};