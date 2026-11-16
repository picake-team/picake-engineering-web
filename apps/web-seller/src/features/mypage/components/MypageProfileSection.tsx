import React, { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/apps/web-seller/common/components/cards/Card";
import { Input } from "@/apps/web-seller/common/components/inputs/Input";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { useUpdateMypageProfile } from "@/apps/web-seller/features/mypage/hooks/mutations/useMypageMutation";
import { useUploadFile } from "@/apps/web-seller/features/upload/hooks/mutations/useUploadMutation";
import { SELLER_VERIFICATION_STATUS_LABEL } from "@/apps/web-seller/features/mypage/constants/mypage.ui";
import type { SellerMypageProfileResponseDto } from "@/apps/web-seller/features/mypage/types/mypage.dto";
import { LoadingSpinner } from "@/apps/web-seller/common/components/loading/LoadingSpinner";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR");
}

interface ProfileFormState {
  name: string;
  nickname: string;
  profileImageUrl: string;
}

function profileToForm(p: SellerMypageProfileResponseDto): ProfileFormState {
  return {
    name: p.name ?? "",
    nickname: p.nickname ?? "",
    profileImageUrl: p.profileImageUrl ?? "",
  };
}

interface MypageProfileSectionProps {
  profile: SellerMypageProfileResponseDto;
}

export const MypageProfileSection: React.FC<MypageProfileSectionProps> = ({ profile }) => {
  const updateMutation = useUpdateMypageProfile();
  const uploadMutation = useUploadFile();

  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(profile));
  const [baseline, setBaseline] = useState<ProfileFormState>(() => profileToForm(profile));

  useEffect(() => {
    const next = profileToForm(profile);
    setForm(next);
    setBaseline(next);
  }, [profile]);

  const dirty =
    form.name !== baseline.name ||
    form.nickname !== baseline.nickname ||
    form.profileImageUrl !== baseline.profileImageUrl;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountImageFailed, setAccountImageFailed] = useState(false);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);

  useEffect(() => {
    setAccountImageFailed(false);
  }, [profile.profileImageUrl]);

  useEffect(() => {
    setPreviewImageFailed(false);
  }, [form.profileImageUrl]);

  const accountImageUrl = profile.profileImageUrl?.trim() ?? "";
  const previewImageUrl = form.profileImageUrl?.trim() ?? "";

  const handleSave = async () => {
    const body: {
      name?: string;
      nickname?: string;
      profileImageUrl?: string | null;
    } = {};
    if (form.name !== baseline.name) body.name = form.name.trim();
    if (form.nickname !== baseline.nickname) body.nickname = form.nickname.trim();
    if (form.profileImageUrl !== baseline.profileImageUrl) {
      const url = form.profileImageUrl.trim();
      body.profileImageUrl = url === "" ? null : url;
    }
    if (Object.keys(body).length === 0) return;
    await updateMutation.mutateAsync(body);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { fileUrl } = await uploadMutation.mutateAsync(file);
    setForm((f) => ({ ...f, profileImageUrl: fileUrl }));
  };

  const statusLabel =
    SELLER_VERIFICATION_STATUS_LABEL[profile.sellerVerificationStatus] ??
    profile.sellerVerificationStatus;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">프로필 이미지</span>
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/90 bg-muted">
              {!accountImageFailed && accountImageUrl ? (
                <img
                  src={accountImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setAccountImageFailed(true)}
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
              )}
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">이름</span>
            <span className="font-medium">{profile.name || "—"}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">닉네임</span>
            <span className="font-medium">{profile.nickname || "—"}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">휴대폰</span>
            <span className="font-medium">{profile.phone}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">로그인 계정</span>
            <span>
              {profile.kakaoEmail
                ? `카카오 (${profile.kakaoEmail})`
                : profile.googleEmail
                  ? `구글 (${profile.googleEmail})`
                  : profile.naverId
                    ? "네이버"
                    : "—"}
            </span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">휴대폰 인증</span>
            <span>{profile.isPhoneVerified ? "완료" : "미완료"}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">판매자 검증</span>
            <span>{statusLabel}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">가입일</span>
            <span>{formatDateTime(profile.createdAt)}</span>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <span className="text-muted-foreground">마지막 로그인</span>
            <span>{formatDateTime(profile.lastLoginAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">프로필 수정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <span className="text-sm font-medium">프로필 이미지</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/90 bg-muted shadow-sm">
                {!previewImageFailed && previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                    onError={() => setPreviewImageFailed(true)}
                  />
                ) : (
                  <User
                    className="h-14 w-14 text-muted-foreground"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5 sm:max-w-[240px] sm:pt-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full justify-center text-sm font-semibold shadow-sm"
                  disabled={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadMutation.isPending ? "업로드 중…" : "이미지 파일 업로드"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full justify-center border-border bg-background text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted/50 hover:text-foreground"
                  onClick={() => setForm((f) => ({ ...f, profileImageUrl: "" }))}
                >
                  이미지 제거
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mypage-name">
              이름
            </label>
            <Input
              id="mypage-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={50}
              placeholder="이름"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mypage-nickname">
              닉네임
            </label>
            <Input
              id="mypage-nickname"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              maxLength={50}
              placeholder="닉네임"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" aria-hidden />
                  저장 중…
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
