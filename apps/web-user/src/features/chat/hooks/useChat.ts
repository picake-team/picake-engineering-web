"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { uploadApi } from "@/apps/web-user/features/upload/apis/upload.api";
import { dataUrlToFile } from "@/apps/web-user/features/quote/utils/quote-photo.util";
import { chatApi } from "@/apps/web-user/features/chat/apis/chat.api";
import { CHAT_LIMITS, chatQueryKeys } from "@/apps/web-user/features/chat/constants/chat.constant";
import { useChatSignalStore } from "@/apps/web-user/features/chat/store/chat-signal.store";
import type {
  ChatMessage,
  ChatThreadDetail,
  PendingChatMessage,
} from "@/apps/web-user/features/chat/types/chat.type";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

/** 안 읽은 채팅 방 수(MY 점·숫자). 로그인했을 때만 */
export function useChatUnread() {
  const hydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: chatQueryKeys.unread(),
    queryFn: chatApi.unread,
    enabled: hydrated && isAuthenticated,
    refetchInterval: CHAT_LIMITS.LIST_POLL_MS,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useChatList(enabled = true) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.list(),
    queryFn: ({ pageParam }) => chatApi.list(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    refetchInterval: CHAT_LIMITS.LIST_POLL_MS,
  });
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
 * 채팅방 하나(기획 I-11).
 * - 처음 최근 30개, 위로 올리면 30개씩(before)
 * - 새 글은 소켓 신호를 받으면 바로, 그 밖에는 소켓이 붙어 있으면 15초·끊기면 3초마다(after). 화면을 내리면 멈춤
 * - 보낼 때 화면에 먼저 놓고(보내는 중) 서버가 받으면 바꿈. 실패하면 "다시 보내기·지우기"
 * - threadId가 없으면(가게에 처음 보내기) 첫 글을 보낼 때 방이 생기고 onThreadCreated로 알린다
 */
export function useChatRoom(input: {
  threadId: string | null;
  start?: { storeId: string; orderId?: string; productId?: string };
  onThreadCreated?: (threadId: string) => void;
}) {
  const { threadId } = input;
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThreadDetail | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(!!threadId);
  const [error, setError] = useState<string | null>(null);
  /** 없는 방·내 방이 아님(404·403): "다시 시도"가 아니라 "찾을 수 없어요" */
  const [notFound, setNotFound] = useState(false);
  const [pending, setPending] = useState<PendingChatMessage[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  /**
   * 새 글 확인의 기준(서버에서 어디까지 가져왔나). 불러오기·새 글 확인 결과로만 옮긴다 — 화면의 마지막 글로 잡으면
   * 내가 보낸 글이 들어오는 순간 기준이 내 글로 넘어가, 그 전에 와 있던 상대 글을 영영 못 가져왔다(11-18 검토)
   */
  const fetchedIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  /** 확인하는 동안 온 신호(끝난 뒤 한 번 더) */
  const againRef = useRef(false);
  /** 주문·상품에서 열었으면 첫 글은 카드를 붙이는 주소(start)로 보낸다 */
  const cardSentRef = useRef(false);
  const socketConnected = useChatSignalStore((s) => s.socketConnected);
  const tick = useChatSignalStore((s) => (threadId ? (s.ticks[threadId] ?? 0) : 0));

  const visible = () => typeof document === "undefined" || document.visibilityState === "visible";
  /**
   * 읽음·"보고 있음"은 창이 앞에 있을 때만 남긴다. PC에서 방을 띄워 두고 다른 창을 쓰거나 자리를 비우면 탭은 "보임"이라
   * 15초마다 읽음 처리돼 휴대폰 알림·알림톡이 하나도 안 갔다(기획 P-82, 11-18 검토). 새 글은 지금처럼 가져온다
   */
  const looking = () =>
    visible() &&
    (typeof document === "undefined" ||
      typeof document.hasFocus !== "function" ||
      document.hasFocus());

  const loadInitial = useCallback(async () => {
    if (!threadId) return;
    // 다른 방으로 바뀌었으면 앞 방의 기준으로 새 글을 찾지 않게
    fetchedIdRef.current = null;
    setLoading(true);
    try {
      const res = await chatApi.messages(threadId, { markRead: looking() });
      const sorted = sortMessages(res.messages);
      fetchedIdRef.current = sorted.length ? sorted[sorted.length - 1].id : null;
      setMessages(sorted);
      setThread(res.thread);
      setHasMore(res.hasMore);
      setError(null);
      setNotFound(false);
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unread() });
    } catch (e) {
      setError(getApiMessage.error(e));
      const status = (e as { response?: { status?: number } })?.response?.status;
      setNotFound(status === 404 || status === 403);
    } finally {
      setLoading(false);
    }
  }, [threadId, queryClient]);

  const fetchNew = useCallback(async () => {
    if (!threadId || !fetchedIdRef.current) return;
    if (fetchingRef.current) {
      againRef.current = true;
      return;
    }
    fetchingRef.current = true;
    try {
      do {
        againRef.current = false;
        const res = await chatApi.messages(threadId, {
          after: fetchedIdRef.current,
          markRead: looking(),
        });
        setThread(res.thread);
        if (res.messages.length) {
          const sorted = sortMessages(res.messages);
          fetchedIdRef.current = sorted[sorted.length - 1].id;
          setMessages((prev) => mergeMessages(prev, sorted));
          void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unread() });
        }
      } while (againRef.current);
    } catch {
      // 잠깐 실패는 다음 확인 때 다시
    } finally {
      fetchingRef.current = false;
    }
  }, [threadId, queryClient]);

  const loadOlder = useCallback(async () => {
    if (!threadId || !hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const res = await chatApi.messages(threadId, { before: messages[0].id });
      setMessages((prev) => mergeMessages(prev, res.messages));
      setHasMore(res.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [threadId, hasMore, loadingOlder, messages]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  // 소켓 신호를 받으면 바로
  useEffect(() => {
    if (tick > 0) void (fetchedIdRef.current ? fetchNew() : loadInitial());
  }, [tick, fetchNew, loadInitial]);

  // 확인 주기(화면이 보일 때만)
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
    // 다른 창에서 돌아오면 그때 읽음으로(창이 앞에 없을 때는 읽음을 남기지 않으므로)
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
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
        const withCard =
          !!input.start &&
          (!!input.start.orderId || !!input.start.productId) &&
          !cardSentRef.current;
        const res =
          threadId && !withCard
            ? await chatApi.send(threadId, body)
            : await chatApi.start({ ...body, ...(input.start as { storeId: string }) });
        cardSentRef.current = true;
        trackEvent("success_chat_message", {
          thread_id: res.threadId,
          store_id: input.start?.storeId ?? null,
          is_first: !threadId,
          photo_count: imageUrls.length,
          with_card: withCard,
        });
        setPending((prev) => prev.filter((x) => x.clientId !== p.clientId));
        setMessages((prev) => mergeMessages(prev, res.messages));
        void queryClient.invalidateQueries({ queryKey: chatQueryKeys.list() });
        if (!threadId) input.onThreadCreated?.(res.threadId);
        return { ok: true as const };
      } catch (e) {
        setPending((prev) =>
          prev.map((x) => (x.clientId === p.clientId ? { ...x, status: "failed" } : x)),
        );
        // 끊김·서버 오류는 말풍선 아래 "보내지 못했어요 · 다시 보내기"로 충분하다(창을 또 띄우지 않음).
        // 차단·잠김처럼 다시 보내도 안 되는 이유(4xx)만 화면이 따로 알린다
        const status = (e as { response?: { status?: number } })?.response?.status;
        const retryable = !status || status >= 500;
        return { ok: false as const, message: getApiMessage.error(e), retryable };
      }
    },
    [threadId, input, queryClient],
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
      notFound,
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
      notFound,
      pending,
      send,
      retry,
      discard,
      loadOlder,
      loadInitial,
    ],
  );
}
