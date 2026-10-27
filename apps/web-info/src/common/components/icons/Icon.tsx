import type { CSSProperties } from "react";
import clsx from "clsx";

import Arrow from "./icons/arrow.svg";
import Calendar from "./icons/calendar.svg";
import SelectArrow from "./icons/select-arrow.svg";
import AddPhoto from "./icons/add-photo.svg";
import Alarm from "./icons/alarm.svg";
import Reservation from "./icons/reservation.svg";
import CheckCircle from "./icons/check_circle.svg";
import LogoPicake from "./icons/logo_picake.svg";

interface IconProps {
  name: keyof typeof iconTypes;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** web-user의 Icon에서 info 사이트가 쓰는 아이콘만 옮겨 왔습니다. */
export const iconTypes = {
  arrow: Arrow,
  calendar: Calendar,
  selectArrow: SelectArrow,
  addPhoto: AddPhoto,
  alarm: Alarm,
  reservation: Reservation,
  checkCircle: CheckCircle,
  logoPicake: LogoPicake,
};

export type IconName = keyof typeof iconTypes;

export default function Icon({ name, width, height, className, ...props }: IconProps) {
  const IconComponent = iconTypes[name];
  return (
    <span className={clsx("inline-flex items-center", className)} {...props}>
      <IconComponent width={width} height={height} className="h-auto max-w-full" />
    </span>
  );
}
