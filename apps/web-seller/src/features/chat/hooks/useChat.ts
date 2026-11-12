import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { uploadApi } from "@/apps/web-seller/features/upload/apis/upload.api";
import { chatApi } from "@/apps/web-seller/features/chat/apis/chat.api";
import {
  CHAT_LIMITS,
  chatQueryKeys,
} from "@/apps/web-seller/features/chat/constants/chat.constants";
import { useChatSignalStore } from "@/apps/web-seller/features/chat/store/chat-signal.store";
import type {
  ChatMessage,
  ChatThreadDetail,
  PendingChatMessage,
} from "@/apps/web-seller/features/chat/types/chat.type";

/** 안 읽은 방·답할 방 수(아래 탭 숫자, 홈 "답할 채팅") */
export function useSellerChatUnread(storeId: string | undefined) {
  return useQuery({
    queryKey: chatQueryKeys.unread(storeId ?? ""),
    queryFn: () => chatApi.unread(storeId as string),
    enabled: !!storeId,
    refetchInterval: CHAT_LIMITS.LIST_POLL_MS,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 10_000,
  });
}

export function useSellerChatList(storeId: string, filter: "reply" | "all") {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.list(storeId, filter),
    queryFn: ({ pageParam }) => chatApi.list(storeId, filter, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!storeId,
    refetchInterval: CHAT_LIMITS.LIST_POLL_MS,
  });
}

/** 사진을 긴 쪽 1600px·JPEG로 줄인다(올리는 시간·저장 비용) */
export async function shrinkPhoto(file: File, maxSide = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}

function sortMessages(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt),
  );
}

function mergeMessages(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of next) map.set(m.id, m);
  return sortMessages([...map.values()]);
}

/**
 * 채팅방 하나(사장님, 기획 I-11). 손님 웹 useChatRoom과 같은 흐름.
 * fromOrderId가 있으면(주문 상세 "채팅") 첫 글은 주문 카드를 붙이는 주소로 보내고, 방이 없으면 여기서 생긴다.
 */
export function useSellerChatRoom(input: {
  storeId: string;
  threadId: string | null;
  fromOrderId?: string;
  onThreadCreated?: (threadId: string) => void;
}) {
  const { storeId, threadId } = input;
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThreadDetail | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(!!threadId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChatMessage[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const lastIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const cardSentRef = useRef(false);
  const socketConnected = useChatSignalStore((s) => s.socketConnected);
  const tick = useChatSignalStore((s) => (threadId ? (s.ticks[threadId] ?? 0) : 0));

  lastIdRef.current = messages.length ? messages[messages.length - 1].id : null;
  const visible = () => document.visibilityState === "visible";

  const invalidateCounts = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unread(storeId) });
    void queryClient.invalidateQueries({ queryKey: ["chat", storeId, "list"] });
  }, [queryClient, storeId]);

  const loadInitial = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const res = await chatApi.messages(storeId, threadId, { markRead: visible() });
      setMessages(sortMessages(res.messages));
      setThread(res.thread);
      setHasMore(res.hasMore);
      setError(null);
      invalidateCounts();
    } catch (e) {
      setError(getApiMessage.error(e));
    } finally {
      setLoading(false);
    }
  }, [storeId, threadId, invalidateCounts]);

  const fetchNew = useCallback(async () => {
    if (!threadId || fetchingRef.current || !lastIdRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await chatApi.messages(storeId, threadId, {
        after: lastIdRef.current,
        markRead: visible(),
      });
      setThread(res.thread);
      if (res.messages.length) {
        setMessages((prev) => mergeMessages(prev, res.messages));
        invalidateCounts();
      }
    } catch {
      // 다음 확인 때 다시
    } finally {
      fetchingRef.current = false;
    }
  }, [storeId, threadId, invalidateCounts]);

  const loadOlder = useCallback(async () => {
    if (!threadId || !hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const res = await chatApi.messages(storeId, threadId, { before: messages[0].id });
      setMessages((prev) => mergeMessages(prev, res.messages));
      setHasMore(res.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [storeId, threadId, hasMore, loadingOlder, messages]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (tick > 0) void (lastIdRef.current ? fetchNew() : loadInitial());
  }, [tick, fetchNew, loadInitial]);

  useEffect(() => {
    if (!threadId) return;
    const ms = socketConnected ? CHAT_LIMITS.POLL_MS_WITH_SOCKET : CHAT_LIMITS.POLL_MS_NO_SOCKET;
    const timer = window.setInterval(() => {
      if (visible()) void fetchNew();
    }, ms);
    const onVisible = () => {
      if (visible()) void fetchNew();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [threadId, socketConnected, fetchNew]);

  const deliver = useCallback(
    async (p: PendingChatMessage) => {
      setPending((prev) =>
        prev.map((x) => (x.clientId === p.clientId ? { ...x, status: "sending" } : x)),
      );
      try {
        const imageUrls: string[] = [];
        for (const [i, dataUrl] of p.photos.entries()) {
          const uploaded = await uploadApi.uploadFile(
            dataUrlToFile(dataUrl, `chat-${Date.now()}-${i}.jpg`),
          );
          imageUrls.push(uploaded.fileUrl);
        }
        const body = {
          clientId: p.clientId,
          ...(p.text.trim() ? { text: p.text.trim() } : {}),
          ...(imageUrls.length ? { imageUrls } : {}),
        };
        const withCard = !!input.fromOrderId && !cardSentRef.current;
        const res =
          threadId && !withCard
            ? await chatApi.send(storeId, threadId, body)
            : await chatApi.startFromOrder(storeId, input.fromOrderId as string, body);
        cardSentRef.current = true;
        setPending((prev) => prev.filter((x) => x.clientId !== p.clientId));
        setMessages((prev) => mergeMessages(prev, res.messages));
        invalidateCounts();
        if (!threadId) input.onThreadCreated?.(res.threadId);
        return { ok: true as const };
      } catch (e) {
        setPending((prev) =>
          prev.map((x) => (x.clientId === p.clientId ? { ...x, status: "failed" } : x)),
        );
        return { ok: false as const, message: getApiMessage.error(e) };
      }
    },
    [storeId, threadId, input, invalidateCounts],
  );

  const send = useCallback(
    (text: string, photos: string[]) => {
      const p: PendingChatMessage = {
        clientId: newClientId(),
        text,
        photos,
        status: "sending",
        createdAt: new Date().toISOString(),
      };
      setPending((prev) => [...prev, p]);
      return deliver(p);
    },
    [deliver],
  );

  const retry = useCallback(
    (clientId: string) => {
      const p = pending.find((x) => x.clientId === clientId);
      if (p) void deliver(p);
    },
    [pending, deliver],
  );

  const discard = useCallback((clientId: string) => {
    setPending((prev) => prev.filter((x) => x.clientId !== clientId));
  }, []);

  return useMemo(
    () => ({
      messages,
      thread,
      setThread,
      hasMore,
      loading,
      loadingOlder,
      error,
      pending,
      send,
      retry,
      discard,
      loadOlder,
      reload: loadInitial,
    }),
    [
      messages,
      thread,
      hasMore,
      loading,
      loadingOlder,
      error,
      pending,
      send,
      retry,
      discard,
      loadOlder,
      loadInitial,
    ],
  );
}
