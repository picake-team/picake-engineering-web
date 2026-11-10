"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  image: string | null;
}

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "생일", image: "/images/contents/category1.png" },
  { id: "2", name: "연인", image: "/images/contents/category2.png" },
  { id: "3", name: "직장", image: "/images/contents/category3.png" },
  { id: "4", name: "친구", image: "/images/contents/category4.png" },
  { id: "5", name: "당일픽업", image: "/images/contents/category5.png" },
];

export default function CategoryList() {
  const measureRef = useRef<HTMLDivElement>(null); // 너비 측정 전용
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const measure = measureRef.current;
    const el = scrollRef.current;
    if (!measure || !el) return;

    const check = () => {
      const buttons = Array.from(el.querySelectorAll("button"));
      const totalButtonWidth = buttons.reduce((sum, btn) => sum + btn.offsetWidth, 0);

      const padding = 40; // 양쪽 20px
      setIsOverflow(totalButtonWidth + padding > measure.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(measure);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div ref={measureRef}>
      {/* 너비 측정 전용 */}
      <div className={isOverflow ? "mx-[-24px]" : ""}>
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex py-2 overflow-x-auto scrollbar-hide ${
            isOverflow
              ? `gap-[10px] pl-[20px] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`
              : "justify-between px-[20px]"
          }`}
        >
          {MOCK_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className="flex flex-col items-center gap-[6px] shrink-0"
            >
              <div className="w-[59px] h-[59px] rounded-full overflow-hidden bg-gray-50">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={59}
                    height={59}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <span className="text-xs text-gray-700 select-none">{category.name}</span>
            </button>
          ))}
          {isOverflow && <div className="min-w-[10px] shrink-0" />}
        </div>
      </div>
    </div>
  );
}
