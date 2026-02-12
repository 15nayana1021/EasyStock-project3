
import { StockData, WatchlistItem, PortfolioItem, TransactionItem, NotificationItem } from '../types';

export interface NewsItem {
  id: number;
  category: string;
  title: string;
  source: string;
  time: string;
  content: string;
}

export interface AgentAdvice {
  id: number;
  type: string;
  tags: string[];
  text: string;
  avatar: string;
  tagColor: string;
  tagBg: string;
  time: string;
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  isUp: boolean;
}

export interface RankedStock extends StockData {
  id: number;
  changeValue: number;
  changeText: string;
  category: string;
}

export const initialWatchlist: WatchlistItem[] = [
  // {
  //   id: 3,
  //   name: '소헌컴퍼니',
  //   badge: '가상',
  //   shares: '1주',
  //   price: '250,500원',
  //   change: '+8.33%',
  //   isUp: true,
  //   color: 'bg-[#F2994A]',
  //   logoText: 'S'
  // }
];

export const marketIndices: MarketIndex[] = [
  { name: 'KOSPI', value: '4,890.12', change: '0.8%', isUp: true },
  { name: 'NASDAQ', value: '16,215.80', change: '0.5%', isUp: true },
  { name: '환율 (USD)', value: '1,430.00', change: '2.5', isUp: true },
];

export const allRankingStocks: RankedStock[] = [
  { id: 1, name: '소헌컴퍼니', price: '260,000원', change: '+15.22%', changeValue: 15.22, changeText: '15.22%', isUp: true, category: '바이오' },
  { id: 2, name: '안방바이오', price: '76,300원', change: '+12.36%', changeValue: 12.36, changeText: '12.36%', isUp: true, category: '바이오' },
  { id: 3, name: '루나셀', price: '12,500원', change: '+10.50%', changeValue: 10.5, changeText: '10.50%', isUp: true, category: '바이오' },
  { id: 4, name: '엔테크', price: '45,200원', change: '+8.20%', changeValue: 8.2, changeText: '8.20%', isUp: true, category: 'IT' },
  { id: 5, name: '미래로봇', price: '198,000원', change: '+7.80%', changeValue: 7.8, changeText: '7.80%', isUp: true, category: 'IT' },
  { id: 6, name: '코드스택', price: '32,400원', change: '+6.90%', changeValue: 6.9, changeText: '6.90%', isUp: true, category: 'IT' },
  { id: 101, name: '블루마린', price: '89,000원', change: '-18.20%', changeValue: -18.2, changeText: '18.20%', isUp: false, category: '바이오' },
  { id: 102, name: '바이오랩', price: '5,400원', change: '-14.80%', changeValue: -14.8, changeText: '14.80%', isUp: false, category: '바이오' },
  { id: 103, name: '오션IT', price: '32,100원', change: '-9.50%', changeValue: -9.5, changeText: '9.50%', isUp: false, category: 'IT' },
  { id: 104, name: '평화전자', price: '15,600원', change: '-5.20%', changeValue: -5.2, changeText: '5.20%', isUp: false, category: '전자' },
  { id: 105, name: '코인뱅크', price: '4,300원', change: '-1.50%', changeValue: -1.5, changeText: '1.50%', isUp: false, category: '금융' },
  { id: 106, name: '나눔에듀', price: '12,000원', change: '-0.50%', changeValue: -0.5, changeText: '0.50%', isUp: false, category: '금융' },
];

export const agentAdvices: AgentAdvice[] = [
  {
    id: 1,
    type: '안정형 에이전트',
    tags: ['#리스크 관리', '#분할매수 추천'],
    text: '지금은 변동성이 커지는 구간입니다.\n현금 비중을 20% 이상 유지하고,\n급등 추격 매수는 피하는 전략이 좋습니다.',
    avatar: 'https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Felix&backgroundColor=b6e3f4',
    tagColor: 'text-[#2D8C69]',
    tagBg: 'bg-[#E8F3EF]',
    time: '1분 전'
  },
  {
    id: 2,
    type: '공격형 에이전트',
    tags: ['#단기매매', '#상승추세'],
    text: '현재 거래량 증가와 함께\n단기 모멘텀이 살아있습니다.\n조정 구간에서 분할 진입을 추천합니다.',
    avatar: 'https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Garrett&backgroundColor=ffdfbf',
    tagColor: 'text-[#D97706]',
    tagBg: 'bg-[#FEF3C7]',
    time: '1시간 전'
  },
  {
    id: 3,
    type: '비관형 에이전트',
    tags: ['#리스크 경고', '#관망 권장'],
    text: '현재 시장은 불확실성에 노출되어 있습니다.\n가급적 관망하며 리스크 관리를 우선하세요.',
    avatar: 'https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Jasper&backgroundColor=d1d5db',
    tagColor: 'text-[#4B5563]',
    tagBg: 'bg-[#F3F4F6]',
    time: '3시간 전'
  }
];

// Sample news data (can be expanded)
export const newsListMock: NewsItem[] = [
    {
      id: 1,
      category: '소헌컴퍼니',
      title: '소헌컴퍼니, 이번 분기 실적 발표, 예상치 상회하며 강세',
      source: '매일경제 경제',
      time: '2시간 전',
      content: '소헌컴퍼니가 최근 발표한 분기 실적에서 사업 부문의 수익성이 크게 개선되면서 어닝 서프라이즈를 기록했습니다.'
    },
    {
      id: 2,
      category: '시장 이슈',
      title: '외국인 투자자들, 반도체 섹터 집중 매수... \'소헌컴퍼니\' 주목',
      source: '한해뉴스투데이',
      time: '5시간 전',
      content: '글로벌 거시 경제 환경의 불확실성에도 불구하고 외국인 투자자들의 매수세가 반도체 대형주로 집중되고 있습니다.'
    },
    {
      id: 3,
      category: '공시 정보',
      title: '소헌컴퍼니, 신규 설비 투자 계획 공시... 생산량 확대 기대',
      source: '금융감독원',
      time: '7시간 전',
      content: '신규 설비 투자를 통해 차세대 반도체 생산 능력을 확충할 계획입니다.'
    },
    {
      id: 4,
      category: '증권가 전망',
      title: '\'소헌컴퍼니\' 목표 주가 상향 조정... 긍정적 모멘텀 지속',
      source: '투자뉴스 24',
      time: '12시간 전',
      content: '주요 증권사들이 잇따라 목표 주가를 올리며 향후 주가 흐름을 낙관하고 있습니다.'
    },
    {
      id: 5,
      category: '테크 트렌드',
      title: '차세대 AI 반도체 시장, \'소헌컴퍼니\'의 전략은?',
      source: '테크포커스',
      time: '어제',
      content: 'AI 시장의 급성장에 대응하기 위한 기업의 전략적 행보가 주목받고 있습니다.'
    },
  ];

export const popularStocks = [
  { rank: 1, name: '삼성전자', price: '78,500원', change: '+1.25%', isUp: true },
  { rank: 2, name: '엔비디아', price: '1,289,555', change: '+3.42%', isUp: true },
  { rank: 3, name: '애플', price: '215,125', change: '+0.85%', isUp: true },
  { rank: 4, name: 'SK하이닉스', price: '127,400원', change: '-0.52%', isUp: false },
  { rank: 5, name: '테슬라', price: '248,355', change: '+5.12%', isUp: true },
  { rank: 6, name: '현대차', price: '245,000원', change: '-1.21%', isUp: false },
  { rank: 7, name: '카카오', price: '52,100원', change: '+0.19%', isUp: true },
];

export interface GeneralNewsItem {
  id: number;
  category: string;
  title: string;
  summary: string;
  source: string;
}

export const generalNewsList: GeneralNewsItem[] = [
  { id: 1, category: 'AI · 반도체', title: '엔비디아 실적 가이던스 상향', summary: 'AI 서버 수요 확대 · 관련주 강세 흐름', source: 'NUTS Finance' },
  { id: 2, category: '가상자산', title: '비트코인 1억 원 재돌파', summary: '거래량 증가 · 단기 변동성 구간 진입', source: 'CryptoWire' },
  { id: 3, category: 'ETF · 자금 흐름', title: '기관 자금 순유입 전환', summary: '연기금 중심 매수세 유입 확인', source: 'Market Insight' },
  { id: 4, category: '글로벌 증시', title: '미국 증시 연속 상승 마감', summary: '기술주 중심 위험자산 선호 지속', source: 'Wall Street Brief' },
  { id: 5, category: '국내 이슈', title: '한국은행 발언 이후 시장 반응', summary: '금리 동결 기조 유지 시그널', source: 'Seoul Economy' },
  { id: 6, category: '금리 변동', title: '연준 의장 추가 금리 인하 시사', summary: '글로벌 시장 안도감 확대', source: 'Global Finance' },
];
