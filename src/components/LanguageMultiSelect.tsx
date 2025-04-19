import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type LanguageOption = {
    value: string;
    label: string;
};

type LanguageMultiSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: LanguageOption[];
    placeholder?: string;
};

const LanguageMultiSelect = ({
    value,
    onChange,
    options,
    placeholder = "选择语言..."
}: LanguageMultiSelectProps) => {
    const [open, setOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);

    // 初始化已选值
    useEffect(() => {
        if (value) {
            setSelectedValues(value.split(',').map(v => v.trim()).filter(Boolean));
        } else {
            setSelectedValues([]);
        }
    }, [value]);

    // 处理选择变更
    const handleSelect = (currentValue: string) => {
        let updatedValues: string[];

        if (selectedValues.includes(currentValue)) {
            updatedValues = selectedValues.filter(v => v !== currentValue);
        } else {
            updatedValues = [...selectedValues, currentValue];
        }

        setSelectedValues(updatedValues);
        onChange(updatedValues.join(','));
    };

    // 移除已选项
    const handleRemove = (valueToRemove: string) => {
        const updatedValues = selectedValues.filter(v => v !== valueToRemove);
        setSelectedValues(updatedValues);
        onChange(updatedValues.join(','));
    };

    return (
        <div className="flex flex-col space-y-1.5">
            <div className="flex flex-wrap gap-1 mb-1.5">
                {selectedValues.length > 0 && selectedValues.map(selectedValue => {
                    const option = options.find(opt => opt.value === selectedValue);
                    return (
                        <Badge
                            key={selectedValue}
                            variant="secondary"
                            className="mr-1 mb-1 flex items-center"
                        >
                            {option?.label || selectedValue}
                            <span
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                onClick={() => handleRemove(selectedValue)}
                            >
                                <X className="h-3 w-3" />
                            </span>
                        </Badge>
                    );
                })}
            </div>
            
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <span className="text-left truncate">
                            {selectedValues.length > 0 
                                ? `已选择 ${selectedValues.length} 个语言` 
                                : <span className="text-muted-foreground">{placeholder}</span>}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="搜索语言..." />
                        <CommandEmpty>未找到匹配选项</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                            {options.map(option => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        handleSelect(option.value);
                                        setOpen(true); // 保持弹窗打开以允许多选
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default LanguageMultiSelect;