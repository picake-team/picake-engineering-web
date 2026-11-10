/**
 * 휴대폰 마이페이지 (SC-94, 디자인 7-E · 로그아웃 창 7-F): 프로필, 계정 정보, 휴대폰 번호 변경, 약관, 앱 버전, 로그아웃, 회원 탈퇴.
 */
import React, { useRef, useState } from "react";
import { appVersion } from "@/apps/web-seller/common/utils/webview.bridge";
import { formatPhoneDisplay } from "@/apps/web-seller/common/utils/phone-display.util";
import { Link } from "react-router-dom";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { Field, TextInput } from "@/apps/web-seller/common/ui/Field";
import { GrayBand, ListRowButton, ListRowLink } from "@/apps/web-seller/common/ui/List";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { kstDateKey } from "@/apps/web-seller/common/utils/kst-date.util";
import { useMypageProfile } from "@/apps/web-seller/features/mypage/hooks/queries/useMypageProfileQuery";
import { useUpdateMypageProfile } from "@/apps/web-seller/features/mypage/hooks/mutations/useMypageMutation";
import { useUploadFile } from "@/apps/web-seller/features/upload/hooks/mutations/useUploadMutation";
import { SELLER_VERIFICATION_STATUS_LABEL } from "@/apps/web-seller/features/mypage/constants/mypage.ui";
import type { SellerMypageProfileResponseDto } from "@/apps/web-seller/features/mypage/types/mypage.dto";
import { useLogout } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";

function formatPhone(phone: string) {
  // 휴대폰 번호가 아닌 값(심사용 계정 표시 등)은 그대로 보여 주지 않는다
  return phone.replace(/\D/g, "").length >= 9 ? formatPhoneDisplay(phone) : "–";
}

function formatDay(iso: string | null | undefined) {
  if (!iso) return "–";
  const key = kstDateKey(iso);
  if (key === kstDateKey(new Date())) return "오늘";
  return key.replace(/-/g, ".");
}

function loginAccount(p: SellerMypageProfileResponseDto) {
  if (p.kakaoId) return `카카오${p.kakaoEmail ? ` (${p.kakaoEmail})` : ""}`;
  if (p.googleId) return `구글${p.googleEmail ? ` (${p.googleEmail})` : ""}`;
  return "–";
}

function Avatar({ url, size = 56 }: { url?: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-50 text-ink-600"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <Icon name="person" size={28} />
      )}
    </span>
  );
}

/** 프로필 수정 창: 사진(사진첩·카메라, 지우기), 이름, 닉네임 */
function ProfileEditSheet({
  open,
  profile,
  onClose,
}: {
  open: boolean;
  profile: SellerMypageProfileResponseDto;
  onClose: () => void;
}) {
  const update = useUpdateMypageProfile();
  const upload = useUploadFile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name ?? "");
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [imageUrl, setImageUrl] = useState(profile.profileImageUrl ?? "");

  const changed =
    name.trim() !== (profile.name ?? "") ||
    nickname.trim() !== (profile.nickname ?? "") ||
    imageUrl !== (profile.profileImageUrl ?? "");

  const save = async () => {
    const body: { name?: string; nickname?: string; profileImageUrl?: string | null } = {};
    if (name.trim() !== (profile.name ?? "")) body.name = name.trim();
    if (nickname.trim() !== (profile.nickname ?? "")) body.nickname = nickname.trim();
    if (imageUrl !== (profile.profileImageUrl ?? "")) body.profileImageUrl = imageUrl || null;
    await update.mutateAsync(body);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showClose
      dismissible={!update.isPending}
      title="프로필 수정"
      footer={
        <ButtonPair>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            돌아가기
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!changed || !name.trim()}
            loading={update.isPending}
          >
            저장
          </Button>
        </ButtonPair>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar url={imageUrl} size={64} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="md"
            loading={upload.isPending}
            loadingLabel="올리는 중"
            onClick={() => fileRef.current?.click()}
          >
            사진 바꾸기
          </Button>
          {imageUrl ? (
            <Button variant="quiet" onClick={() => setImageUrl("")}>
              사진 지우기
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const { fileUrl } = await upload.mutateAsync(file);
              setImageUrl(fileUrl);
            }}
          />
        </div>
      </div>
      <Field label="이름">
        {(p) => (
          <TextInput
            id={p.id}
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      <Field label="닉네임">
        {(p) => (
          <TextInput
            id={p.id}
            value={nickname}
            maxLength={30}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}
      </Field>
    </BottomSheet>
  );
}

export const MypageIndexMobilePage: React.FC = () => {
  const { data: profile, isLoading } = useMypageProfile();
  const logout = useLogout();
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const sha = import.meta.env.VITE_PUBLIC_GITHUB_SHA?.trim();

  return (
    <AppScreen header={<BackHeader title="마이페이지" />} bodyClassName="pt-2">
      {isLoading || !profile ? (
        <span className="block h-48 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Avatar url={profile.profileImageUrl} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-group font-bold text-ink-900">
                {profile.name || "이름 없음"}
              </span>
              {profile.nickname ? (
                <span className="truncate text-sub text-ink-600">닉네임 {profile.nickname}</span>
              ) : null}
            </span>
            <Button
              variant="secondary"
              size="md"
              className="px-3"
              onClick={() => setEditOpen(true)}
            >
              프로필 수정
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-card border border-ink-100 p-4">
            <h2 className="text-body font-bold text-ink-900">계정 정보</h2>
            {[
              ["휴대폰", formatPhone(profile.phone)],
              ["로그인 계정", loginAccount(profile)],
              ["휴대폰 인증", profile.isPhoneVerified ? "완료" : "미완료"],
              [
                "판매자 검증",
                SELLER_VERIFICATION_STATUS_LABEL[profile.sellerVerificationStatus] ??
                  profile.sellerVerificationStatus,
              ],
              [
                "가입일 · 마지막 로그인",
                `${formatDay(profile.createdAt)} · ${formatDay(profile.lastLoginAt)}`,
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 text-sub">
                <span className="shrink-0 text-ink-600">{k}</span>
                <span className="min-w-0 break-all text-right font-semibold text-ink-900">{v}</span>
              </div>
            ))}
          </div>

          <div>
            <ListRowLink to={ROUTES.MYPAGE_PHONE} title="휴대폰 번호 변경" divider={false} />
            <ListRowLink
              to={ROUTES.TERMS.TERMS_OF_SERVICE}
              title="서비스 이용약관"
              trailing={
                <span className="text-sub text-ink-600">
                  {profile.agreedTermsVersion ? "약관 보기" : "미동의"}
                </span>
              }
              divider={false}
            />
            <ListRowLink
              to={ROUTES.TERMS.PRIVACY_POLICY}
              title="개인정보 처리방침"
              trailing={
                <span className="text-sub text-ink-600">
                  {profile.agreedPrivacyVersion ? "약관 보기" : "미동의"}
                </span>
              }
              divider={false}
            />
            <div className="flex min-h-13 items-center gap-3 py-2">
              <span className="flex-1 text-body font-semibold text-ink-900">앱 버전</span>
              <span className="text-sub text-ink-600">
                {appVersion() ?? `웹${sha ? ` ${sha.slice(0, 7)}` : ""}`}
              </span>
            </div>
          </div>
          <GrayBand />
          <ListRowButton
            onClick={() => setLogoutOpen(true)}
            title="로그아웃"
            chevron
            divider={false}
          />
          <Link
            to={ROUTES.MYPAGE_WITHDRAW}
            className="inline-flex min-h-11 items-center self-start py-1 text-sub text-ink-600"
          >
            회원 탈퇴
          </Link>

          {editOpen ? (
            <ProfileEditSheet open profile={profile} onClose={() => setEditOpen(false)} />
          ) : null}
          <BottomSheet
            open={logoutOpen}
            onClose={() => setLogoutOpen(false)}
            title="로그아웃할까요?"
            description="이 휴대폰으로는 주문 알림이 오지 않아요."
            footer={
              <ButtonPair>
                <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
                  돌아가기
                </Button>
                <Button loading={logout.isPending} onClick={() => logout.mutate()}>
                  로그아웃
                </Button>
              </ButtonPair>
            }
          />
        </>
      )}
    </AppScreen>
  );
};
