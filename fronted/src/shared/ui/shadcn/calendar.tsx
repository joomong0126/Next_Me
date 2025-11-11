"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function CustomCaption(props: CaptionProps) {
  const { goToMonth, currentMonth } = useNavigation();
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // 년도 범위 (현재 년도 기준 ±50년)
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const newDate = new Date(newYear, currentMonthIndex);
    goToMonth(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentYear, newMonth);
    goToMonth(newDate);
  };

  const handleYearBack = () => {
    const newDate = new Date(currentYear - 1, currentMonthIndex);
    goToMonth(newDate);
  };

  const handleYearForward = () => {
    const newDate = new Date(currentYear + 1, currentMonthIndex);
    goToMonth(newDate);
  };

  return (
    <div className="flex items-center justify-between w-full px-2 py-2">
      <button
        type="button"
        onClick={handleYearBack}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronsLeft className="size-4" />
      </button>
      
      <div className="flex items-center gap-2">
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="text-sm font-medium bg-transparent border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
        
        <select
          value={currentMonthIndex}
          onChange={handleMonthChange}
          className="text-sm font-medium bg-transparent border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {months.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleYearForward}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronsRight className="size-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium hidden",
        nav: "flex items-center gap-1 hidden",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };