import React, { useMemo, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useUploadFile } from "@/apps/web-seller/features/upload/hooks/mutations/useUploadMutation";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: boolean;
}

// 리치 텍스트 에디터 공용 컴포넌트
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력해 주세요.",
  minHeight = 400,
  error = false,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const uploadMutation = useUploadFile();

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
    }),
    [],
  );

  // 이미지 핸들러 설정
  useEffect(() => {
    // quill이 준비될 때까지 약간의 지연
    const timer = setTimeout(() => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const toolbar = quill.getModule("toolbar");
      if (!toolbar) return;

      // 화면 읽기: 편집 도구는 아이콘뿐이라 버튼마다 이름을 붙인다
      const container = (toolbar as { container?: HTMLElement }).container;
      const buttonNames: Record<string, string> = {
        "ql-bold": "굵게",
        "ql-italic": "기울임",
        "ql-underline": "밑줄",
        "ql-strike": "취소선",
        "ql-link": "링크",
        "ql-image": "사진 넣기",
        "ql-clean": "서식 지우기",
      };
      const pickerNames: Record<string, string> = {
        "ql-header": "글자 크기",
        "ql-align": "정렬",
        "ql-color": "글자 색",
        "ql-background": "배경 색",
      };
      container?.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if (button.classList.contains("ql-list")) {
          button.setAttribute(
            "aria-label",
            button.value === "ordered" ? "번호 목록" : "글머리 목록",
          );
          return;
        }
        const name = [...button.classList].map((c) => buttonNames[c]).find(Boolean);
        if (name) button.setAttribute("aria-label", name);
      });
      container?.querySelectorAll<HTMLElement>(".ql-picker").forEach((picker) => {
        const name = [...picker.classList].map((c) => pickerNames[c]).find(Boolean);
        picker.querySelector(".ql-picker-label")?.setAttribute("aria-label", name ?? "고르기");
      });

      // 이미지 핸들러 커스터마이징
      toolbar.addHandler("image", () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.style.display = "none";
        document.body.appendChild(input);
        input.click();

        input.onchange = () => {
          const file = input.files?.[0];
          document.body.removeChild(input);

          if (!file) return;

          // 비동기 처리
          (async () => {
            try {
              // 이미지 업로드
              const response = await uploadMutation.mutateAsync(file);
              const imageUrl = response.fileUrl;

              // Quill 에디터에 이미지 삽입
              const editor = quillRef.current?.getEditor();
              if (!editor) return;

              // 에디터에 포커스를 주고 range 설정을 보장
              editor.focus();

              // 에디터가 준비될 때까지 약간의 지연
              await new Promise((resolve) => setTimeout(resolve, 0));

              // 현재 선택 영역 가져오기
              let range = editor.getSelection(true);
              const length = editor.getLength();

              // range가 없거나 유효하지 않으면 끝에 커서 설정
              if (!range || range.index < 0) {
                // 에디터가 비어있으면 0, 아니면 끝에
                const insertIndex = length > 1 ? length - 1 : 0;
                editor.setSelection(insertIndex, 0);
                // 다시 range 가져오기
                range = editor.getSelection(true);
              }

              // range가 여전히 없으면 기본 위치 사용
              if (!range) {
                const insertIndex = length > 1 ? length - 1 : 0;
                range = { index: insertIndex, length: 0 };
              }

              // 이미지 삽입
              editor.insertEmbed(range.index, "image", imageUrl);

              // 커서를 이미지 다음으로 이동
              setTimeout(() => {
                editor.setSelection(range.index + 1, 0);
              }, 0);
            } catch (error) {
              console.error("이미지 업로드 실패:", error);
            }
          })();
        };
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [uploadMutation]);

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image",
    "color",
    "background",
  ];

  return (
    <div className={cn("quill-editor-wrapper", error && "quill-error")}>
      <style>{`
        .quill-editor-wrapper .quill .ql-toolbar {
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          background-color: hsl(var(--muted));
        }
        .quill-editor-wrapper .quill .ql-container {
          min-height: ${minHeight}px;
          font-size: 16px;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .quill-editor-wrapper .quill .ql-editor {
          min-height: ${minHeight}px;
        }
        .quill-error .quill .ql-toolbar,
        .quill-error .quill .ql-container {
          border-color: hsl(var(--destructive));
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};
