import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Button } from '@/shared/ui/shadcn/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearMonthPickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function YearMonthPicker({ date, onDateChange }: YearMonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const selectedYear = date?.getFullYear() || currentYear;
  const selectedMonth = date?.getMonth() || 0;

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), selectedMonth, 1);
    onDateChange(newDate);
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = parseInt(month);
    const newDate = new Date(selectedYear, monthIndex, 1);
    onDateChange(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1, 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedYear, selectedMonth + 1, 1);
    onDateChange(newDate);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-2 flex-1">
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

