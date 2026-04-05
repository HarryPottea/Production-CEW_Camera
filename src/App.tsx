/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Camera,
  Search,
  CalendarDays,
  ArrowUpRight,
  Bell,
  Workflow,
  Loader2,
  ChevronRight,
  Sparkles,
  Rss,
  Radio,
  CheckCircle2,
  Clock3,
  Megaphone,
  Aperture,
  Video,
  Mic,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { demoEquipmentData } from "./data/demoEquipment";
import generatedEquipmentData from "./data/equipment.generated.json";
import type { EquipmentItem } from "./types";

const crawlerTargets = [
  "소니 뉴스룸 / HTML 아카이브",
  "캐논 글로벌 뉴스 / HTML 아카이브",
  "니콘 공식 RSS",
  "블랙매직 디자인 RSS",
  "향후 추가: RED / Sigma / Tamron",
];

const statusStyles: Record<string, string> = {
  발표: "bg-white/10 text-orange-100 border-orange-400/20",
  "출시 예정": "bg-orange-500/15 text-orange-200 border-orange-400/30",
  "출시 완료": "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
};

function StatCard({ title, value, subtext, icon: Icon }: { title: string; value: string | number; subtext: string; icon: any }) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/45">{title}</p>
            <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-white/45">{subtext}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-orange-500/10 p-3 text-orange-200">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "출시 완료") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "출시 예정") return <Clock3 className="h-3.5 w-3.5" />;
  return <Megaphone className="h-3.5 w-3.5" />;
}

function EquipmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border ${statusStyles[status] || "bg-white/10 text-white border-white/10"}`}
    >
      <StatusIcon status={status} />
      {status}
    </Badge>
  );
}

function getPrimaryLink(item: EquipmentItem) {
  return item.news_url || item.product_url || item.official_url || null;
}

function getCategoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("camera") || normalized.includes("cinema")) return Video;
  if (normalized.includes("lens")) return Aperture;
  if (normalized.includes("audio") || normalized.includes("mic")) return Mic;
  return Camera;
}

function normalizeData(items: EquipmentItem[]) {
  return items.map((item) => ({
    ...item,
    news_url: item.news_url ?? item.official_url ?? null,
  }));
}

function isUsefulFeatured(item: EquipmentItem) {
  const text = `${item.model} ${item.source_title || ""} ${item.summary}`.toLowerCase();
  return !text.includes("thousand and one nights") && !text.includes("support") && !text.includes("update!");
}

export default function CameraTeamHub() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [loading] = useState(false);

  const equipmentData = useMemo(() => {
    const generated = normalizeData((generatedEquipmentData as EquipmentItem[]) || []);
    return generated.length > 0 ? generated : demoEquipmentData;
  }, []);

  const brands = useMemo(() => ["전체", ...Array.from(new Set(equipmentData.map((item) => item.brand)))], [equipmentData]);
  const categories = useMemo(() => ["전체", ...Array.from(new Set(equipmentData.map((item) => item.category)))], [equipmentData]);
  const statuses = ["전체", "발표", "출시 예정", "출시 완료"];

  const filtered = useMemo(() => {
    return equipmentData.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchKeyword = !keyword
        ? true
        : [item.brand, item.model, item.category, item.summary, item.source_title || ""].join(" ").toLowerCase().includes(keyword);
      const matchBrand = brand === "전체" ? true : item.brand === brand;
      const matchCategory = category === "전체" ? true : item.category === category;
      const matchStatus = status === "전체" ? true : item.status === status;
      return matchKeyword && matchBrand && matchCategory && matchStatus;
    });
  }, [search, brand, category, status, equipmentData]);

  const featured = equipmentData.filter((item) => item.featured && isUsefulFeatured(item)).slice(0, 4);
  const upcoming = equipmentData.filter((item) => item.status === "출시 예정");
  const announcedOnly = equipmentData.filter((item) => item.status === "발표");
  const latest = equipmentData.slice(0, 6);
  const heroItem = featured[0] || equipmentData[0];

  return (
    <div className="min-h-screen bg-[#120d0c] text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,58,58,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,132,0,0.14),transparent_32%),linear-gradient(180deg,#2b130f_0%,#120d0c_35%,#090909_100%)]" />
        <div className="absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5 lg:p-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,125,33,0.94),rgba(255,69,0,0.86)_36%,rgba(74,17,17,0.94)_80%,rgba(14,14,14,0.96))] sm:rounded-[1.75rem]">
            <div className="flex flex-col gap-8 p-5 sm:p-7 lg:gap-10 lg:p-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-sm">Production CEW Camera</p>
                  <p className="mt-2 text-sm text-white/70">공식 발표 뉴스와 제품 출시 흐름을 빠르게 확인하는 카메라팀 모니터링 보드</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white hover:bg-white/10 sm:px-4">
                    <Rss className="mr-1.5 h-3.5 w-3.5" /> 공식 뉴스 소스
                  </Badge>
                  <Button className="rounded-full bg-white text-black hover:bg-white/90" disabled>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
                    자동 수집 반영 중
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-end lg:gap-8">
                <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white/80 sm:text-base">최신 카메라 장비 인텔리전스</p>
                    <h1 className="max-w-3xl text-4xl font-semibold leading-[0.92] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                      Camera
                      <br />
                      Release Desk
                    </h1>
                  </div>

                  <p className="max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                    브랜드별 공식 발표 글을 중심으로 새 장비, 출시 예정 제품, 확인이 필요한 뉴스를 한 화면에서 정리합니다.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">추적 항목</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{equipmentData.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">출시 예정</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{upcoming.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">신규 발표</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{announcedOnly.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">브랜드</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{brands.length - 1}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 backdrop-blur-md sm:p-6 sm:rounded-[1.75rem]">
                  <p className="text-sm font-medium text-white/60">오늘의 주목 장비</p>
                  <div className="mt-6 sm:mt-8">
                    <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                      {heroItem?.brand || "Camera Team"}
                    </Badge>
                    <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                      {heroItem?.model || "공식 발표 하이라이트"}
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-white/68">
                      {heroItem?.summary || "최근 발표된 장비와 주요 업데이트를 팀의 의사결정 흐름에 맞게 보여줍니다."}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <EquipmentStatusBadge status={heroItem?.status || "발표"} />
                      <span className="text-xs text-white/45">발표일 {heroItem?.announced_at || "-"}</span>
                    </div>
                    {heroItem && getPrimaryLink(heroItem) ? (
                      <Button className="mt-8 h-12 min-w-[220px] rounded-full bg-orange-500 px-6 text-white hover:bg-orange-400 sm:min-w-[240px]" asChild>
                        <a href={getPrimaryLink(heroItem)!} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center whitespace-nowrap">
                          공식 발표 글 보기
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 bg-black/45 px-5 py-5 sm:px-7 md:grid-cols-2 xl:grid-cols-4 lg:px-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">소스 레이어</p>
                <p className="mt-2 text-sm text-white/75">공식 RSS, HTML 아카이브, 브랜드 뉴스룸</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">핵심 정보</p>
                <p className="mt-2 text-sm text-white/75">장비 발표 글, 제품 관련 기사, 공식 링크</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">동기화 방식</p>
                <p className="mt-2 text-sm text-white/75">GitHub Actions 6시간 주기 자동 수집</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">출력 구조</p>
                <p className="mt-2 text-sm text-white/75">공식 발표 글 우선 연결, JSON 기반 운영</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="전체 장비" value={equipmentData.length} subtext="수집/등록된 항목" icon={Camera} />
            <StatCard title="출시 예정" value={upcoming.length} subtext="곧 체크할 신제품" icon={CalendarDays} />
            <StatCard title="신규 발표" value={announcedOnly.length} subtext="최근 공식 발표" icon={Bell} />
            <StatCard title="라이브 소스" value={crawlerTargets.length} subtext="활성 뉴스 피드" icon={Radio} />
          </div>

          <Tabs defaultValue="dashboard" className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
            <div className="overflow-x-auto pb-1">
              <TabsList className="inline-flex h-auto min-w-max rounded-full border border-white/10 bg-white/5 p-1 text-white backdrop-blur-xl">
                <TabsTrigger value="dashboard" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">주요 장비</TabsTrigger>
                <TabsTrigger value="equipment" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">장비 데이터</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">수집 소스</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-8 outline-none">
              <div className="grid gap-6 xl:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader className="border-b border-white/8 pb-6">
                    <div className="flex items-center gap-2 text-orange-200">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">주요 발표 장비</span>
                    </div>
                    <CardTitle className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                      최근 주목할 장비 발표
                    </CardTitle>
                    <CardDescription className="max-w-xl text-white/55">
                      팀에서 바로 확인해야 할 공식 발표 장비와 관련 글을 먼저 보여줍니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {featured.map((item) => (
                        <div key={item.id} className="group rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition-all hover:border-orange-400/30 hover:bg-black/30">
                          <div className="flex items-start justify-between gap-3">
                            <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-white">
                              {item.brand}
                            </Badge>
                            <EquipmentStatusBadge status={item.status} />
                          </div>
                          <h3 className="mt-5 text-xl font-semibold text-white sm:text-2xl">{item.model}</h3>
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                            {React.createElement(getCategoryIcon(item.category), { className: "h-3.5 w-3.5" })}
                            <span>{item.category}</span>
                          </div>
                          <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/62">{item.summary}</p>
                          <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                            <span className="text-xs text-white/42">{item.announced_at}</span>
                            {getPrimaryLink(item) ? (
                              <a
                                href={getPrimaryLink(item)!}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-orange-300/30 hover:bg-orange-500 hover:text-white"
                                aria-label={`${item.model} 관련 뉴스 열기`}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">최신 타임라인</CardTitle>
                      <CardDescription className="text-white/45">최근 공지된 장비/뉴스 항목 흐름</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {latest.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="mt-1 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.8)]" />
                          <div className="min-w-0 flex-1 border-b border-white/6 pb-4 last:border-b-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{item.model}</p>
                                <p className="mt-1 text-xs text-white/45">{item.brand} · {item.announced_at}</p>
                              </div>
                              <EquipmentStatusBadge status={item.status} />
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/58">{item.source_title || item.summary}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">활성 수집 소스</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      {crawlerTargets.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/72">
                          <div className="h-2 w-2 rounded-full bg-orange-400" />
                          {item}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-6 outline-none">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="모델명, 브랜드, 기사 제목 검색..."
                        className="h-12 rounded-full border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
                      <Select value={brand} onValueChange={setBrand}>
                        <SelectTrigger className="h-12 w-full min-w-[140px] rounded-full border-white/10 bg-black/20 text-white">
                          <SelectValue placeholder="브랜드" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-12 w-full min-w-[140px] rounded-full border-white/10 bg-black/20 text-white">
                          <SelectValue placeholder="카테고리" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-12 w-full min-w-[140px] rounded-full border-white/10 bg-black/20 text-white">
                          <SelectValue placeholder="상태" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[980px]">
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/8 hover:bg-transparent">
                            <TableHead className="w-[120px] text-white/55">브랜드</TableHead>
                            <TableHead className="min-w-[220px] text-white/55">모델명</TableHead>
                            <TableHead className="w-[190px] text-white/55">카테고리</TableHead>
                            <TableHead className="w-[180px] text-white/55">발표일 / 상태</TableHead>
                            <TableHead className="w-[110px] pr-6 text-center text-white/55">링크</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.length > 0 ? (
                            filtered.map((item) => (
                              <TableRow key={item.id} className="border-white/6 hover:bg-white/[0.03]">
                                <TableCell className="font-medium text-white">{item.brand}</TableCell>
                                <TableCell className="text-white">{item.model}</TableCell>
                                <TableCell>
                                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75">
                                    {React.createElement(getCategoryIcon(item.category), { className: "h-3.5 w-3.5" })}
                                    <span>{item.category}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex min-w-[150px] flex-col gap-2">
                                    <span className="text-xs font-medium text-white/75">{item.announced_at}</span>
                                    <EquipmentStatusBadge status={item.status} />
                                  </div>
                                </TableCell>
                                <TableCell className="pr-6 text-center">
                                  {getPrimaryLink(item) ? (
                                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 text-white hover:bg-orange-500 hover:text-white" asChild>
                                      <a href={getPrimaryLink(item)!} target="_blank" rel="noreferrer" aria-label={`${item.model} 관련 뉴스 열기`}>
                                        <ChevronRight className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-white/30">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow className="border-white/6 hover:bg-transparent">
                              <TableCell colSpan={5} className="h-24 text-center text-sm text-white/45">
                                검색 조건에 맞는 장비가 없습니다.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6 outline-none">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Workflow className="h-4 w-4 text-orange-300" /> 자동 수집 운영 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">동기화 명령</p>
                      <p className="mt-3 font-mono text-sm text-orange-200">npm run sync:news</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">데이터 소스</p>
                      <p className="mt-3 text-sm leading-6 text-white/62">
                        자동 수집 결과를 `equipment.generated.json`에 저장하고, 프론트는 이 파일을 직접 읽습니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Rss className="h-4 w-4 text-orange-300" /> 활성 수집 소스
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {crawlerTargets.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/72">
                        <div className="h-2 w-2 rounded-full bg-orange-400" />
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
