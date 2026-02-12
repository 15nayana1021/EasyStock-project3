import React from "react";
import PopularStocks from "./PopularStocks";

// 이제 자산 정보(props)를 받지 않아도 됩니다.
const HomeContent: React.FC = () => {
  return (
    <div className="h-full pt-2">
      {/* 초록색 박스를 제거하고 인기 종목만 보여줍니다. */}
      <PopularStocks />
    </div>
  );
};

export default HomeContent;
