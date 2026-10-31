import React from "react";

export interface BadmintonIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export function Badminton({
  size = 24,
  strokeWidth = 2,
  className,
  ...props
}: BadmintonIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Vành lông vũ trên cùng */}
      <path d="M4 4.5c2.5 1.5 5.5 2 8 2s5.5-.5 8-2" />
      {/* Hai cạnh bên */}
      <path d="M4 4.5L9 16" />
      <path d="M20 4.5L15 16" />
      {/* Các nan lông cầu bên trong */}
      <path d="M8 5.5L10.5 16" />
      <path d="M12 6.5V16" />
      <path d="M16 5.5L13.5 16" />
      {/* Chỉ buộc cố định thân cầu */}
      <path d="M6 10.5c2 .8 4 1.2 6 1.2s4-.4 6-1.2" />
      {/* Đế cầu (nút bần tròn) */}
      <path d="M9 16h6v1.5a3 3 0 0 1-6 0V16z" />
    </svg>
  );
}
