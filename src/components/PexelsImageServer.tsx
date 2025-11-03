import React from 'react';

interface PexelsImageServerProps {
  query: string;
  alt?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'original';
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

/**
 * Pexels API를 사용하여 키워드로 이미지를 검색하고 표시하는 서버 컴포넌트
 * 
 * @param query - 검색할 키워드
 * @param alt - 이미지 alt 텍스트 (기본값: query)
 * @param className - 이미지에 적용할 CSS 클래스
 * @param size - 이미지 크기 (small, medium, large, original)
 */
export default async function PexelsImageServer({ 
  query, 
  alt, 
  className = '',
  size = 'medium' 
}: PexelsImageServerProps) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      return (
        <div className={`bg-red-50 border border-red-200 p-4 rounded ${className}`}>
          <p className="text-red-600 text-sm">
            Pexels API 키가 설정되지 않았습니다. PEXELS_API_KEY 환경 변수를 설정해주세요.
          </p>
        </div>
      );
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      next: {
        revalidate: 3600, // 1시간마다 재검증
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: PexelsResponse = await response.json();
    
    if (!data.photos || data.photos.length === 0) {
      return (
        <div className={`bg-yellow-50 border border-yellow-200 p-4 rounded ${className}`}>
          <p className="text-yellow-700 text-sm">
            &quot;{query}&quot; 키워드로 이미지를 찾을 수 없습니다.
          </p>
        </div>
      );
    }

    const photo = data.photos[0];
    const sizeMap = {
      small: photo.src.small,
      medium: photo.src.medium,
      large: photo.src.large,
      original: photo.src.original,
    };
    const imageUrl = sizeMap[size];

    return (
      <div className={className}>
        <img 
          src={imageUrl} 
          alt={alt || photo.alt || query} 
          className="w-full h-auto"
        />
        <p className="text-xs text-gray-500 mt-1">
          Photo by{' '}
          <a 
            href={photo.photographer_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            {photo.photographer}
          </a>
          {' '}on Pexels
        </p>
      </div>
    );
  } catch (error) {
    console.error('이미지 가져오기 오류:', error);
    return (
      <div className={`bg-red-50 border border-red-200 p-4 rounded ${className}`}>
        <p className="text-red-600 text-sm">
          이미지를 가져오는 중 오류가 발생했습니다: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
      </div>
    );
  }
}

