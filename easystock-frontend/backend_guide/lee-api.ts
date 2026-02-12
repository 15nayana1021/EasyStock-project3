// src/api.ts

const BASE_URL = "http://localhost:8000/api";

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  description: string;
}

// 1. 모든 기업 목록 가져오기 (전광판용)
export const fetchCompanies = async (): Promise<Company[]> => {
  try {
    const response = await fetch(`${BASE_URL}/companies`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

// 2. 부자 랭킹 가져오기
export const fetchRanking = async () => {
  try {
    const response = await fetch(`${BASE_URL}/rank`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch ranking:", error);
    return [];
  }
};

// 3. 특정 기업 뉴스 가져오기
export const fetchCompanyNews = async (companyName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/news/${companyName}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};