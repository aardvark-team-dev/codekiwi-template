'use client';

import React, { useState, useEffect } from 'react';

interface PexelsImageProps {
  query: string;
  alt?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'original';
}

interface PexelsImageData {
  imageUrl: string;
  alt: string;
  photographer: string;
  photographer_url: string;
}

/**
 * Pexels API를 사용하여 키워드로 이미지를 검색하고 표시하는 컴포넌트
 * API Route를 통해 안전하게 이미지를 가져옵니다.
 * 
 * @param query - 검색할 키워드
 * @param alt - 이미지 alt 텍스트 (기본값: API에서 제공하는 alt)
 * @param className - 이미지에 적용할 CSS 클래스
 * @param size - 이미지 크기 (small, medium, large, original)
 */
export default function PexelsImage({ 
  query, 
  alt, 
  className = '',
  size = 'medium' 
}: PexelsImageProps) {
  const [imageData, setImageData] = useState<PexelsImageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        // API Route 호출 (API 키가 클라이언트에 노출되지 않음!)
        const response = await fetch(
          `/api/pexels?query=${encodeURIComponent(query)}&size=${size}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API 요청 실패');
        }

        const data: PexelsImageData = await response.json();
        setImageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        console.error('이미지 가져오기 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchImage();
    }
  }, [query, size]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={{ minHeight: '200px' }}>
        <span className="sr-only">이미지 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 p-4 rounded ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!imageData) {
    return null;
  }

  return (
    <div className={className}>
      <img 
        src={imageData.imageUrl} 
        alt={alt || imageData.alt || query} 
        className="w-full h-auto rounded"
      />
    </div>
  );
}

