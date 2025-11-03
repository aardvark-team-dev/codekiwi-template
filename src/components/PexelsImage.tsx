'use client';

import React, { useState, useEffect } from 'react';

interface PexelsImageProps {
  query: string;
  alt?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'original';
}

/**
 * Pexels API를 사용하여 키워드로 이미지를 검색하고 표시하는 컴포넌트
 * 
 * @param query - 검색할 키워드
 * @param alt - 이미지 alt 텍스트 (기본값: query)
 * @param className - 이미지에 적용할 CSS 클래스
 * @param size - 이미지 크기 (small, medium, large, original)
 */
export default function PexelsImage({ 
  query, 
  alt, 
  className = '',
  size = 'medium' 
}: PexelsImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = process.env.PEXELS_API_KEY;
        
        if (!apiKey) {
          throw new Error('Pexels API 키가 설정되지 않았습니다. PEXELS_API_KEY 환경 변수를 설정해주세요.');
        }

        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;

        const response = await fetch(url, {
          headers: {
            Authorization: apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          const photo = data.photos[0];
          // 요청된 크기에 따라 이미지 URL 선택
          const sizeMap = {
            small: photo.src.small,
            medium: photo.src.medium,
            large: photo.src.large,
            original: photo.src.original,
          };
          setImageUrl(sizeMap[size]);
        } else {
          throw new Error(`"${query}" 키워드로 이미지를 찾을 수 없습니다.`);
        }
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
      <div className={`animate-pulse bg-gray-200 ${className}`} style={{ minHeight: '200px' }}>
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

  if (!imageUrl) {
    return null;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt || query} 
      className={className}
    />
  );
}

