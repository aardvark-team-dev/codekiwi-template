import { NextRequest, NextResponse } from 'next/server';

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
  photographer: string;
  photographer_url: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query');
    const size = request.nextUrl.searchParams.get('size') || 'medium';
    
    if (!query) {
      return NextResponse.json(
        { error: '검색 키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서버에서만 API 키 사용 (안전!)
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Pexels API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      // 캐싱 설정
      next: {
        revalidate: 3600, // 1시간 캐시
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API 오류: ${response.status}`);
    }

    const data: PexelsResponse = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return NextResponse.json(
        { error: `"${query}" 키워드로 이미지를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    const photo = data.photos[0];
    
    // 클라이언트에 필요한 정보만 반환
    return NextResponse.json({
      imageUrl: photo.src[size as keyof typeof photo.src] || photo.src.medium,
      alt: photo.alt,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
    });

  } catch (error) {
    console.error('Pexels API 오류:', error);
    return NextResponse.json(
      { error: '이미지를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

