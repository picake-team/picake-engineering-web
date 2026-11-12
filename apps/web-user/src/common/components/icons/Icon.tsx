import type { CSSProperties } from "react";
import clsx from "clsx";

import Cart from "./icons/cart.svg";
import ChevronLeft from "./icons/chevron-left.svg";
import Arrow from "./icons/arrow.svg";
import Favorite from "./icons/favorite.svg";
import FavoriteFilled from "./icons/favorite-filled.svg";
import FavoriteShadow from "./icons/favoriteShadow.svg";
import FavoriteShadowFilled from "./icons/favoriteShadowFilled.svg";
import Close from "./icons/close.svg";
import Close2 from "./icons/close2.svg";
import Close3 from "./icons/close3.svg";
import Calendar from "./icons/calendar.svg";
import SelectArrow from "./icons/select-arrow.svg";
import AddPhoto from "./icons/add-photo.svg";
import RemovePhoto from "./icons/remove-photo.svg";
import Takeout from "./icons/takeout.svg";
import Trash from "./icons/trash.svg";
import Minus from "./icons/minus.svg";
import Plus from "./icons/plus.svg";
import Warning from "./icons/warning.svg";
import Star from "./icons/star.svg";
import Quantity from "./icons/quantity.svg";
import Location from "./icons/location.svg";
import Search from "./icons/search.svg";
import Bullet from "./icons/bullet.svg";
import Alarm from "./icons/alarm.svg";
import Home from "./icons/home.svg";
import Map from "./icons/map.svg";
import MapFilled from "./icons/map-filled.svg";
import Mypage from "./icons/mypage.svg";
import CloseCircle from "./icons/close_circle.svg";
import CheckCircle from "./icons/check_circle.svg";
import AlertCircle from "./icons/alert_circle.svg";
import Check from "./icons/check.svg";
import CheckboxSmallDefault from "./icons/checkbox-small-default.svg";
import CheckboxSmallSelected from "./icons/checkbox-small-selected.svg";
import Reset from "./icons/reset.svg";
import CurrentLocation from "./icons/current-location.svg";
import Setting from "./icons/setting.svg";
import Review from "./icons/review.svg";
import Recent from "./icons/recent.svg";
import Saved from "./icons/saved.svg";
import Reservation from "./icons/reservation.svg";
import List from "./icons/list.svg";
import Back from "./icons/back.svg";
import NoData from "./icons/no-data.svg";
import Filter from "./icons/filter.svg";
import FilterActive from "./icons/filter-active.svg";
import Line1 from "./icons/line1.svg";
import Handle from "./icons/handle.svg";
import Sort from "./icons/sort.svg";
import ReviewFill from "./icons/review_fill.svg";
import Pencil from "./icons/pencil.svg";
import Pencle from "./icons/pencle.svg";
import ReviewQna from "./icons/review_qna.svg";
import Copy from "./icons/copy.svg";
import Multiply from "./icons/multiply.svg";
import CardMore from "./icons/card_more.svg";
import LogoPicake from "./icons/logo_picake.svg";
import NoticeTop from "./icons/notice_top.svg";
import MypageNav from "./icons/mypage_nav.svg";
import MypageNavFilled from "./icons/mypage_nav-filled.svg";
import NoneStore from "./icons/none-store.svg";
import NoneAlarm from "./icons/none-alarm.svg";
import Chat from "./icons/chat.svg";
import More from "./icons/more.svg";
import Send from "./icons/send.svg";

interface IconProps {
  name: keyof typeof iconTypes;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

export const iconTypes = {
  cart: Cart,
  chevronLeft: ChevronLeft,
  arrow: Arrow,
  favorite: Favorite,
  favoriteFilled: FavoriteFilled,
  favoriteShadow: FavoriteShadow,
  favoriteShadowFilled: FavoriteShadowFilled,
  close: Close,
  close2: Close2,
  close3: Close3,
  calendar: Calendar,
  selectArrow: SelectArrow,
  addPhoto: AddPhoto,
  removePhoto: RemovePhoto,
  takeout: Takeout,
  trash: Trash,
  minus: Minus,
  plus: Plus,
  warning: Warning,
  star: Star,
  quantity: Quantity,
  location: Location,
  search: Search,
  bullet: Bullet,
  alarm: Alarm,
  home: Home,
  map: Map,
  mapFilled: MapFilled,
  mypage: Mypage,
  closeCircle: CloseCircle,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
  check: Check,
  checkboxSmallDefault: CheckboxSmallDefault,
  checkboxSmallSelected: CheckboxSmallSelected,
  reset: Reset,
  currentLocation: CurrentLocation,
  setting: Setting,
  review: Review,
  recent: Recent,
  saved: Saved,
  reservation: Reservation,
  list: List,
  back: Back,
  noData: NoData,
  filter: Filter,
  filterActive: FilterActive,
  line1: Line1,
  handle: Handle,
  sort: Sort,
  reviewFill: ReviewFill,
  pencil: Pencil,
  pencle: Pencle,
  reviewQna: ReviewQna,
  copy: Copy,
  multiply: Multiply,
  cardMore: CardMore,
  logoPicake: LogoPicake,
  noticeTop: NoticeTop,
  mypageNav: MypageNav,
  mypageNavFilled: MypageNavFilled,
  noneStore: NoneStore,
  noneAlarm: NoneAlarm,
  chat: Chat,
  more: More,
  send: Send,
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
