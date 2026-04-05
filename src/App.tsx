/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  Camera,
  Search,
  CalendarDays,
  ArrowUpRight,
  Bell,
  Database,
  Star,
  Workflow,
  Server,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Rss,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { demoEquipmentData } from "./data/demoEquipment";
import { hasSupabaseEnv, supabase } from "./lib/supabase";
import type { EquipmentItem } from "./types";

const supabaseSchema = [
  { column: "id", type: "text", note: "고유 식별자" },
  { column: "brand", type: "text", note: "브랜드명" },
  { column: "model", type: "text", note: "제품명 또는 기사 기반 모델명" },
  { column: "category", type: "text", note: "카메라 / 렌즈 / 짐벌 등" },
  { column: "announced_at", type: "date", note: "공식 발표일" },
  { column: "release_date", type: "date", note: "출시일 또는 예정일" },
  { column: "status", type: "text", note: "발표 / 출시 예정 / 출시 완료" },
  { column: "summary", type: "text", note: "짧은 설명 또는 기사 요약" },
  { column: "news_url", type: "text", note: "공식 뉴스/보도자료 링크" },
  { column: "product_url", type: "text", note: "제품 상세 페이지 링크" },
  { column: "official_url", type: "text", note: "레거시 호환용 링크" },
  { column: "manual_url", type: "text", note: "매뉴얼 링크" },
  { column: "firmware_url", type: "text", note: "펌웨어 링크" },
  { column: "is_published", type: "boolean", note: "노출 여부" },
  { column: "featured", type: "boolean", note: "주요 장비 여부" },
  { column: "source_title", type: "text", note: "원본 뉴스 제목" },
];

const crawlerTargets = [
  "Sony MediaRoom / HTML 아카이브",
  "Canon Global News / HTML 아카이브",
  "Nikon 공식 RSS",
  "Blackmagic Design RSS",
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
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/45">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
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

function EquipmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${statusStyles[status] || "bg-white/10 text-white border-white/10"}`}
    >
      {status}
    </Badge>
  );
}

function getPrimaryLink(item: EquipmentItem) {
  return item.news_url || item.product_url || item.official_url || null;
}

export default function CameraTeamHub() {
  const [equipmentData, setEquipmentData] = useState<EquipmentItem[]>(demoEquipmentData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [status, setStatus] = useState("전체");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!hasSupabaseEnv || !supabase) {
        setError("Supabase 환경 변수가 없어 데모 데이터를 보여주고 있습니다. 수집 결과를 쓰려면 sync:news와 DB 연결이 필요합니다.");
        return;
      }

      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("is_published", true)
        .order("announced_at", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setEquipmentData(data as EquipmentItem[]);
      } else {
        setError("게시된 장비 데이터가 없어 데모 데이터를 표시합니다.");
      }
    } catch (err: any) {
      console.error("Supabase fetch error:", err);
      setError(err?.message || "데이터를 불러오지 못해 데모 데이터를 표시합니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const featured = equipmentData.filter((item) => item.featured).slice(0, 4);
  const upcoming = equipmentData.filter((item) => item.status === "출시 예정");
  const announcedOnly = equipmentData.filter((item) => item.status === "발표");
  const latest = equipmentData.slice(0, 6);
  const heroItem = equipmentData[0];

  return (
    <div className="min-h-screen bg-[#120d0c] text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,58,58,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,132,0,0.14),transparent_32%),linear-gradient(180deg,#2b130f_0%,#120d0c_35%,#090909_100%)]" />
        <div className="absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-6 lg:p-8">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,125,33,0.94),rgba(255,69,0,0.86)_36%,rgba(74,17,17,0.94)_80%,rgba(14,14,14,0.96))]">
            <div className="flex flex-col gap-10 p-6 md:p-8 lg:p-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] text-white/70 uppercase">Production CEW Camera</p>
                  <p className="mt-2 text-sm text-white/70">브랜드 공식 뉴스 기반으로 장비 발표와 출시 흐름을 추적하는 카메라팀 허브</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-white hover:bg-white/10">
                    <Rss className="mr-1.5 h-3.5 w-3.5" /> 공식 뉴스 소스
                  </Badge>
                  <Button
                    onClick={() => fetchData()}
                    className="rounded-full bg-white text-black hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    데이터 동기화
                  </Button>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-base font-medium text-white/80">Latest camera intelligence</p>
                    <h1 className="max-w-3xl text-5xl font-semibold leading-[0.92] tracking-tight text-white md:text-6xl lg:text-7xl">
                      Camera
                      <br />
                      Release Desk
                    </h1>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-white/72 md:text-base">
                    장비 출시 뉴스, 발표 흐름, 공식 보도자료 링크를 하나의 화면에서 정리합니다.
                    촬영팀이 바로 확인하고 판단할 수 있게 빠르고 시네마틱하게 설계했습니다.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Tracked items</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{equipmentData.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Upcoming</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{upcoming.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Announcements</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{announcedOnly.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Brands</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{brands.length - 1}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
                  <p className="text-sm font-medium text-white/60">Focus item</p>
                  <div className="mt-8">
                    <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                      {heroItem?.brand || "Camera Team"}
                    </Badge>
                    <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
                      {heroItem?.model || "Official release spotlight"}
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-white/68">
                      {heroItem?.summary || "최근 발표된 장비와 주요 업데이트를 팀의 의사결정 흐름에 맞게 보여줍니다."}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <EquipmentStatusBadge status={heroItem?.status || "발표"} />
                      <span className="text-xs text-white/45">발표일 {heroItem?.announced_at || "-"}</span>
                    </div>
                    {heroItem && getPrimaryLink(heroItem) ? (
                      <Button className="mt-8 rounded-full bg-orange-500 text-white hover:bg-orange-400" asChild>
                        <a href={getPrimaryLink(heroItem)!} target="_blank" rel="noreferrer">
                          공식 뉴스 보기
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 bg-black/45 px-6 py-5 md:grid-cols-4 md:px-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Source layer</p>
                <p className="mt-2 text-sm text-white/75">공식 RSS, HTML 아카이브, 브랜드 뉴스룸</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Editorial flow</p>
                <p className="mt-2 text-sm text-white/75">촬영팀이 보는 발표·출시·참고 링크 중심 구조</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Sync mode</p>
                <p className="mt-2 text-sm text-white/75">GitHub Actions 6시간 주기 자동 수집</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Output</p>
                <p className="mt-2 text-sm text-white/75">뉴스 링크 우선, 제품 페이지 보조 구조</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="전체 장비" value={equipmentData.length} subtext="수집/등록된 항목" icon={Camera} />
            <StatCard title="출시 예정" value={upcoming.length} subtext="곧 체크할 신제품" icon={CalendarDays} />
            <StatCard title="신규 발표" value={announcedOnly.length} subtext="최근 공식 발표" icon={Bell} />
            <StatCard title="라이브 소스" value={crawlerTargets.length} subtext="활성 뉴스 피드" icon={Radio} />
          </div>

          <Tabs defaultValue="dashboard" className="mt-10 space-y-8">
            <TabsList className="h-auto rounded-full border border-white/10 bg-white/5 p-1 text-white backdrop-blur-xl">
              <TabsTrigger value="dashboard" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">큐레이션</TabsTrigger>
              <TabsTrigger value="equipment" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">장비 데이터</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white">시스템</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 outline-none">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader className="border-b border-white/8 pb-6">
                    <div className="flex items-center gap-2 text-orange-200">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Curated highlights</span>
                    </div>
                    <CardTitle className="mt-3 text-4xl font-semibold leading-tight text-white">
                      지금 기능에 맞는
                      <br />
                      시네마틱 뉴스 대시보드
                    </CardTitle>
                    <CardDescription className="max-w-xl text-white/55">
                      레퍼런스의 분위기는 가져오되, 촬영팀이 장비 발표 정보를 읽고 바로 링크를 확인할 수 있도록 UI 구조를 재설계했습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {featured.map((item) => (
                        <div key={item.id} className="group rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition-all hover:border-orange-400/30 hover:bg-black/30">
                          <div className="flex items-start justify-between gap-3">
                            <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-white">
                              {item.brand}
                            </Badge>
                            <EquipmentStatusBadge status={item.status} />
                          </div>
                          <h3 className="mt-5 text-2xl font-semibold text-white">{item.model}</h3>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">{item.category}</p>
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
                      <CardTitle className="text-lg text-white">Latest timeline</CardTitle>
                      <CardDescription className="text-white/45">최근 공지된 장비/뉴스 항목 흐름</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {latest.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="mt-1 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.8)]" />
                          <div className="min-w-0 flex-1 border-b border-white/6 pb-4 last:border-b-0">
                            <div className="flex items-start justify-between gap-3">
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
                      <CardTitle className="text-lg text-white">Active source stack</CardTitle>
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
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="모델명, 브랜드, 기사 제목 검색..."
                        className="h-12 rounded-full border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={brand} onValueChange={setBrand}>
                        <SelectTrigger className="h-12 w-[140px] rounded-full border-white/10 bg-black/20 text-white">
                          <SelectValue placeholder="브랜드" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-12 w-[140px] rounded-full border-white/10 bg-black/20 text-white">
                          <SelectValue placeholder="카테고리" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-12 w-[140px] rounded-full border-white/10 bg-black/20 text-white">
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
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/8 hover:bg-transparent">
                          <TableHead className="text-white/55">브랜드</TableHead>
                          <TableHead className="text-white/55">모델명</TableHead>
                          <TableHead className="text-white/55">카테고리</TableHead>
                          <TableHead className="text-white/55">발표일</TableHead>
                          <TableHead className="text-white/55">상태</TableHead>
                          <TableHead className="text-white/55">원본 제목</TableHead>
                          <TableHead className="text-right text-white/55">링크</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length > 0 ? (
                          filtered.map((item) => (
                            <TableRow key={item.id} className="border-white/6 hover:bg-white/[0.03]">
                              <TableCell className="font-medium text-white">{item.brand}</TableCell>
                              <TableCell className="text-white">{item.model}</TableCell>
                              <TableCell className="text-white/65">{item.category}</TableCell>
                              <TableCell className="text-xs text-white/45">{item.announced_at}</TableCell>
                              <TableCell><EquipmentStatusBadge status={item.status} /></TableCell>
                              <TableCell className="max-w-[280px] truncate text-xs text-white/45">{item.source_title || item.summary}</TableCell>
                              <TableCell className="text-right">
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
                            <TableCell colSpan={7} className="h-24 text-center text-sm text-white/45">
                              검색 조건에 맞는 장비가 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6 outline-none">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Server className="h-4 w-4 text-orange-300" /> 데이터베이스 스키마
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {supabaseSchema.map((item) => (
                      <div key={item.column} className="flex items-center justify-between border-b border-white/6 py-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{item.column}</p>
                          <p className="text-xs text-white/45">{item.note}</p>
                        </div>
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-white">
                          {item.type}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Workflow className="h-4 w-4 text-orange-300" /> 자동 수집 운영 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Sync command</p>
                      <p className="mt-3 font-mono text-sm text-orange-200">npm run sync:news</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Visual direction</p>
                      <p className="mt-3 text-sm leading-6 text-white/62">
                        다크 시네마틱 무드, 오렌지 글로우, 큰 타이포, 강한 대비를 사용하되 정보 구조는 카메라 출시 뉴스 대시보드에 맞게 재구성했습니다.
                      </p>
                    </div>
                    {error ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs text-orange-200">
                        <AlertCircle className="h-4 w-4" /> {error}
                      </div>
                    ) : null}
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
