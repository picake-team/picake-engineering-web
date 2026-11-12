import { useEffect, useState } from "react";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { Field, TextInput } from "@/apps/web-seller/common/ui/Field";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { useReviewLogin } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";

const CODE_LENGTH = 6;

/**
 * 심사용 로그인 창 (SC-62, I-48 앱 심사 준비).
 * 로그인 화면 로고를 2초 안에 10번 누르면 열린다. 문구와 버튼은 손님 앱 심사용 로그인 창과 같다
 * (심사용 로그인 · 코드 입력 · 6자리 코드 입력 · 취소 / 로그인). 코드가 맞으면 심사용 사장님 계정으로 들어가 홈을 열고,
 * 서버가 심사용 가게의 예시 주문을 처음 상태로 되돌린다. 코드는 심사노트에만 적는다.
 */
export function ReviewLoginSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const reviewLogin = useReviewLogin();

  useEffect(() => {
    if (open) setCode("");
  }, [open]);

  const valid = code.length === CODE_LENGTH;

  const submit = () => {
    if (!valid || reviewLogin.isPending) return;
    reviewLogin.mutate(code);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissible={!reviewLogin.isPending}
      title="심사용 로그인"
      footer={
        <ButtonPair primaryWeight={2}>
          <Button variant="secondary" onClick={onClose} disabled={reviewLogin.isPending}>
            취소
          </Button>
          <Button onClick={submit} disabled={!valid} loading={reviewLogin.isPending}>
            로그인
          </Button>
        </ButtonPair>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="코드 입력">
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={code}
              // 붙여 넣은 "123 456"처럼 숫자 밖 글자가 섞여도 숫자만 남긴 뒤 6자리로 자른다(maxLength를 두면 먼저 잘려 버림)
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리 코드 입력"
            />
          )}
        </Field>
      </form>
    </BottomSheet>
  );
}
