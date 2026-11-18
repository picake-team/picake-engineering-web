import { useState } from "react";
import { StatusBadge } from "@/apps/web-admin/common/components/badges/StatusBadge";
import { Button } from "@/apps/web-admin/common/components/buttons/Button";
import { cn } from "@/apps/web-admin/common/utils/classname.util";
import {
  LIST_TABLE_CELL,
  LIST_TABLE_CELL_MUTED,
  LIST_TABLE_HEAD,
} from "@/apps/web-admin/common/constants/list-typography.constant";
import {
  useActAsActions,
  useActAsSessions,
} from "@/apps/web-admin/features/store-management/hooks/queries/useActAsQuery";
import { useEndActAs } from "@/apps/web-admin/features/store-management/hooks/mutations/useActAsMutation";
import { formatStoreManagementDateTime } from "@/apps/web-admin/features/store-management/utils/store-management-date.util";
import type {
  ActAsActionItemDto,
  ActAsActionSummaryDto,
  ActAsSessionItemDto,
  ActAsSessionStatus,
} from "@/apps/web-admin/features/store-management/types/act-as.dto";

const STATUS_LABEL: Record<ActAsSessionStatus, string> = {
  ACTIVE: "진행 중",
  ENDED: "끝남",
  EXPIRED: "시간 지남",
};

const SUMMARY_LABELS: Array<[keyof ActAsActionSummaryDto, string]> = [
  ["product", "상품"],
  ["manualOrder", "주문"],
  ["calendar", "캘린더"],
  ["store", "스토어"],
  ["view", "본 화면"],
  ["blocked", "막힘"],
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

/** 누가 끝냈나: 서버 endedBy "self" | "admin:<id>" */
function endedByLabel(endedBy: string | null): string {
  if (endedBy === "self") return "직접";
  if (endedBy?.startsWith("admin:")) return "관리자";
  return "";
}

function ActionTable({ sessionId }: { sessionId: string }) {
  // 서버가 바꾼 것·실패한 것만 준다(화면을 보기만 한 요청 수는 세션 요약에)
  const { data: rows, isLoading } = useActAsActions(sessionId, true);
  if (isLoading) return <p className="py-2 text-xs text-muted-foreground">불러오는 중…</p>;
  if (!rows || rows.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">바꾼 것이 없습니다.</p>;
  }
  return (
    <div className="mt-2">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={cn("w-20 px-2 py-1.5", LIST_TABLE_HEAD)}>시각</th>
            <th className={cn("px-2 py-1.5", LIST_TABLE_HEAD)}>요청</th>
            <th className={cn("w-36 px-2 py-1.5", LIST_TABLE_HEAD)}>보낸 칸</th>
            <th className={cn("w-14 px-2 py-1.5 text-right", LIST_TABLE_HEAD)}>결과</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a: ActAsActionItemDto) => (
            <tr key={a.id} className="border-b border-border/60 last:border-0 align-top">
              <td className={cn("px-2 py-1.5 tabular-nums", LIST_TABLE_CELL_MUTED)}>
                {formatTime(a.createdAt)}
              </td>
              <td className={cn("px-2 py-1.5 font-mono text-xs break-all", LIST_TABLE_CELL)}>
                {a.method} {a.route}
                {a.targetId ? (
                  <span className="block text-muted-foreground">{a.targetId}</span>
                ) : null}
              </td>
              <td className={cn("px-2 py-1.5 text-xs break-all", LIST_TABLE_CELL_MUTED)}>
                {a.fields.length > 0 ? a.fields.join(", ") : "-"}
              </td>
              <td className="px-2 py-1.5 text-right">
                <StatusBadge
                  variant={a.status === 403 ? "error" : a.status >= 400 ? "warning" : "default"}
                >
                  {a.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionRow({ session, storeId }: { session: ActAsSessionItemDto; storeId: string }) {
  const [open, setOpen] = useState(false);
  // 끝내면 그 탭에서 쓰던 내용이 사라지므로 한 번 더 묻는다
  const [confirmEnd, setConfirmEnd] = useState(false);
  const end = useEndActAs(storeId);
  const ended = session.endedAt
    ? `${formatTime(session.endedAt)}${endedByLabel(session.endedBy) ? ` · ${endedByLabel(session.endedBy)}` : ""}`
    : null;
  const summary = SUMMARY_LABELS.filter(([key]) => session.summary[key] > 0)
    .map(([key, label]) => `${label} ${session.summary[key]}`)
    .join(" · ");
  return (
    <li className="border-b border-border/60 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="tabular-nums">{formatStoreManagementDateTime(session.startedAt)}</span>
        <span className="text-muted-foreground">{session.adminUsername}</span>
        <StatusBadge variant={session.status === "ACTIVE" ? "warning" : "default"}>
          {STATUS_LABEL[session.status]}
        </StatusBadge>
        {ended ? <span className="text-xs text-muted-foreground">{ended}</span> : null}
        <span className="ml-auto flex gap-1">
          {session.status === "ACTIVE" && !confirmEnd ? (
            <Button size="sm" variant="outline" onClick={() => setConfirmEnd(true)}>
              끝내기
            </Button>
          ) : null}
          {session.status === "ACTIVE" && confirmEnd ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                disabled={end.isPending}
                onClick={() => end.mutate(session.id, { onSettled: () => setConfirmEnd(false) })}
              >
                {end.isPending ? "끝내는 중…" : "지금 끝내기"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmEnd(false)}>
                취소
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? "접기" : "기록 보기"}
          </Button>
        </span>
      </div>
      <p className="mt-1 text-sm break-all">{session.reason}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{summary || "한 일 없음"}</p>
      {open ? <ActionTable sessionId={session.id} /> : null}
    </li>
  );
}

/** 관리자 스토어 상세 "대리 입력 기록"(기획 I-41) */
export function ActAsSessionList({ storeId }: { storeId: string }) {
  const { data, isLoading } = useActAsSessions(storeId);
  if (isLoading) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">대리 입력 기록이 없습니다.</p>;
  }
  return (
    <ul>
      {data.map((s) => (
        <SessionRow key={s.id} session={s} storeId={storeId} />
      ))}
    </ul>
  );
}
