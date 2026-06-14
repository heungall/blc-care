"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api, getApiErrorMessage } from "@/lib/api";
import type { NewcomerFormValues } from "@/lib/types";

export const newcomerSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  phone: z.string().trim().min(1, "휴대폰 번호를 입력해주세요."),
  address: z.string(),
  visit_motivation: z.string(),
  visit_channel: z.string(),
  faith_experience: z.string(),
  after_service_plan: z.string(),
  privacy_agreed: z.boolean().refine((agreed) => agreed, "개인정보 수집 및 이용에 동의해주세요."),
});

export function NewcomerForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<NewcomerFormValues>({
    resolver: zodResolver(newcomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      visit_motivation: "",
      visit_channel: "",
      faith_experience: "",
      after_service_plan: "",
      privacy_agreed: false,
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await api.submitNewcomer(values);
      router.push("/newcomer/complete");
    } catch (error) {
      setError("root", { message: getApiErrorMessage(error) });
    }
  });

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Card>
        <h2 className="text-lg font-bold">기본 정보</h2>
        <p className="mt-1 text-sm text-slate-500">필수 항목은 이름과 휴대폰 번호입니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="이름" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="샘플 이름" autoComplete="name" />
          </Field>
          <Field label="휴대폰 번호" required error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="주소">
            <Input {...register("address")} placeholder="서울시 샘플구" autoComplete="street-address" />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">방문 및 안내 정보</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="방문 경로">
            <Select {...register("visit_channel")}>
              <option value="">선택해주세요</option>
              <option value="샘플 지인 안내">지인 안내</option>
              <option value="샘플 온라인 안내">온라인 안내</option>
              <option value="샘플 현장 안내">현장 안내</option>
            </Select>
          </Field>
          <Field label="예배 이후 일정">
            <Input {...register("after_service_plan")} placeholder="필요한 경우 입력해주세요." />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="방문 동기">
            <Textarea {...register("visit_motivation")} className="min-h-24" />
          </Field>
          <Field label="신앙생활 경험">
            <Textarea {...register("faith_experience")} className="min-h-24" />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">개인정보 수집 및 이용 동의</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          입력하신 정보는 새신자 안내, 연락, 성도 등록 및 공동체 돌봄을 위해 사용되며 허가된 관리자만 접근할 수 있습니다.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <input type="checkbox" className="mt-1 size-4" {...register("privacy_agreed")} />
          <span>개인정보 수집 및 이용에 동의합니다. <strong className="text-blue-700">(필수)</strong></span>
        </label>
        {errors.privacy_agreed && <p className="mt-2 text-sm text-rose-700">{errors.privacy_agreed.message}</p>}
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting}>등록 내용 제출</Button>
      {errors.root?.message && <p className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700">{errors.root.message}</p>}
      <p className="text-center text-xs text-slate-400">제출 내용은 Apps Script API를 통해 저장됩니다.</p>
    </form>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label} {required && <span className="text-blue-700">(필수)</span>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-sm font-normal text-rose-700">{error}</p>}
    </label>
  );
}
