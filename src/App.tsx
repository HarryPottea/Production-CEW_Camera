/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Camera,
  Search,
  Filter,
  CalendarDays,
  ArrowUpRight,
  Bell,
  Database,
  Settings,
  SlidersHorizontal,
  Star,
  FolderOpen,
  Shield,
  Workflow,
  Server,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { hasSupabaseEnv, supabase } from "./lib/supabase";

const supabaseSchema = [
  { column: "id", type: "uuid", note: "기본 키" },
  { column: "brand", type: "text", note: "브랜드명" },
  { column: "model", type: "text", note: "제품명" },
  { column: "category", type: "text", note: "카메라 / 렌즈 / 짐벌 등" },
  { column: "announced_at", type: "date", note: "공식 발표일" },
  { column: "release_date", type: "date", note: "출시일 또는 예정일" },
  { column: "status", type: "text", note: "발표 / 출시 예정 / 출시 완료" },
  { column: "summary", type: "text", note: "짧은 설명" },
  { column: "official_url", type: "text", note: "공식 링크" },
  { column: "manual_url", type: "text", note: "매뉴얼 링크" },
  { column: "firmware_url", type: "text", note: "펌웨어 링크" },
  { column: "is_published", type: "boolean", note: "노출 여부" },
  { column: "featured", type: "boolean", note: "주요 장비 여부" },
  { column: "created_at", type: "timestamp", note: "생성일" },
];

const crawlerTargets = [
  "Sony 공식 뉴스룸",
  "Canon 공식 뉴스",
  "Nikon 공식 뉴스",
  "Blackmagic Design 뉴스",
  "RED Digital Cinema 뉴스",
  "Sigma / Tamron 제품 공지",
];

const initialEquipmentData = [
  {
    id: 1,
    brand: "Sony",
    model: "BURANO",
    category: "Cinema Camera",
    announced_at: "2025-09-12",
    release_date: "2025-10-01",
    status: "출시 완료",
    summary: "풀프레임 시네마 라인업의 경량형 모델로, 현장 운용성과 핸드헬드 대응력이 강점입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: true,
  },
  {
    id: 2,
    brand: "Canon",
    model: "C80",
    category: "Cinema Camera",
    announced_at: "2026-02-18",
    release_date: "2026-04-15",
    status: "출시 예정",
    summary: "다큐, 인터뷰, 소규모 상업 촬영 워크플로를 가정한 시네마 카메라 예시 데이터입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: true,
  },
  {
    id: 3,
    brand: "Sigma",
    model: "28-45mm F1.8 DG DN II",
    category: "Lens",
    announced_at: "2026-03-02",
    release_date: "2026-03-29",
    status: "출시 완료",
    summary: "저조도 대응과 얕은 심도 표현을 중시하는 촬영 환경을 위한 대구경 줌 렌즈 예시 데이터입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: false,
  },
  {
    id: 4,
    brand: "DJI",
    model: "RS 5 Pro",
    category: "Gimbal",
    announced_at: "2026-03-20",
    release_date: "2026-04-28",
    status: "출시 예정",
    summary: "시네마 카메라 밸런싱과 차량 촬영 운용을 고려한 상위 짐벌 예시 데이터입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: true,
  },
  {
    id: 5,
    brand: "Blackmagic",
    model: "PYXIS 6K",
    category: "Cinema Camera",
    announced_at: "2026-01-10",
    release_date: "2026-02-05",
    status: "출시 완료",
    summary: "박스형 바디 기반 리그 구성이 필요한 촬영 세팅을 위한 예시 데이터입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: false,
  },
  {
    id: 6,
    brand: "Hollyland",
    model: "Mars 5 Max",
    category: "Wireless Video",
    announced_at: "2026-03-14",
    release_date: "2026-05-03",
    status: "발표",
    summary: "무선 송수신 안정성과 현장 모니터링 환경 개선을 위한 장비 예시 데이터입니다.",
    official_url: "#",
    manual_url: "#",
    firmware_url: "#",
    featured: false,
  },
];

const statusStyles: Record<string, string> = {
  발표: "bg-zinc-100 text-zinc-600 border-zinc-200",
  "출시 예정": "bg-blue-50 text-blue-700 border-blue-100",
  "출시 완료": "bg-green-50 text-green-700 border-green-100",
};

function StatCard({ title, value, subtext, icon: Icon }: { title: string; value: string | number; subtext: string; icon: any }) {
  return (
    <Card className="border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{value}</p>
            <p className="mt-1 text-xs text-zinc-400">{subtext}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2 text-zinc-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EquipmentStatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${statusStyles[status] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{status}</Badge>;
}

export default function CameraTeamHub() {
  const [equipmentData, setEquipmentData] = useState<any[]>(initialEquipmentData);
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
        setError("Supabase 환경 변수가 설정되지 않아 데모 데이터를 표시합니다.");
        return;
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_published', true)
        .order('announced_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setEquipmentData(data);
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
        : [item.brand, item.model, item.category, item.summary].join(" ").toLowerCase().includes(keyword);
      const matchBrand = brand === "전체" ? true : item.brand === brand;
      const matchCategory = category === "전체" ? true : item.category === category;
      const matchStatus = status === "전체" ? true : item.status === status;
      return matchKeyword && matchBrand && matchCategory && matchStatus;
    });
  }, [search, brand, category, status, equipmentData]);

  const featured = equipmentData.filter((item) => item.featured);
  const upcoming = equipmentData.filter((item) => item.status === "출시 예정");
  const announcedOnly = equipmentData.filter((item) => item.status === "발표");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Camera Team Hub</h1>
            <p className="mt-2 text-sm text-zinc-500">
              최신 촬영 장비 정보 및 출시 일정을 한눈에 확인하세요.
              {error && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" /> 데모 데이터 사용 중
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => fetchData()}
              variant="outline"
              className="bg-white border-zinc-200 hover:bg-zinc-50"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              데이터 동기화
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <StatCard title="전체 장비" value={equipmentData.length} subtext="등록된 모든 장비" icon={Camera} />
          <StatCard title="출시 예정" value={upcoming.length} subtext="곧 출시될 신제품" icon={CalendarDays} />
          <StatCard title="신규 발표" value={announcedOnly.length} subtext="최근 발표된 장비" icon={Bell} />
          <StatCard title="브랜드" value={brands.length - 1} subtext="등록된 제조사" icon={Star} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="bg-zinc-100 p-1">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="equipment">장비 목록</TabsTrigger>
            <TabsTrigger value="admin">시스템 정보</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-10 outline-none">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> 주요 업데이트
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featured.map((item) => (
                    <Card key={item.id} className="border-zinc-200 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none">{item.brand}</Badge>
                          <EquipmentStatusBadge status={item.status} />
                        </div>
                        <CardTitle className="text-xl mt-2">{item.model}</CardTitle>
                        <CardDescription className="text-xs">{item.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-zinc-600 line-clamp-2 mb-4">{item.summary}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                          <span className="text-xs text-zinc-400">출시일: {item.release_date}</span>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                            <a href={item.official_url} target="_blank" rel="noreferrer">
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-semibold">최근 타임라인</h2>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                  {equipmentData.slice(0, 5).map((item) => (
                    <div key={item.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.model}</p>
                        <p className="text-xs text-zinc-500">{item.brand} · {item.release_date}</p>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6 outline-none">
            <Card className="border-zinc-200">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="모델명, 브랜드 검색..."
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="브랜드" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-[130px]">
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

                <div className="rounded-md border border-zinc-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="w-[100px]">브랜드</TableHead>
                        <TableHead>모델명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>발표일</TableHead>
                        <TableHead>출시일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">링크</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length > 0 ? (
                        filtered.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.brand}</TableCell>
                            <TableCell>{item.model}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-zinc-500 text-xs">{item.announced_at}</TableCell>
                            <TableCell className="text-zinc-500 text-xs">{item.release_date}</TableCell>
                            <TableCell><EquipmentStatusBadge status={item.status} /></TableCell>
                            <TableCell className="text-right">
                              {item.official_url && item.official_url !== "#" ? (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                  <a href={item.official_url} target="_blank" rel="noreferrer" aria-label={`${item.model} 공식 링크 열기`}>
                                    <ChevronRight className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-zinc-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-sm text-zinc-500">
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
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" /> 데이터베이스 스키마
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supabaseSchema.map((item) => (
                    <div key={item.column} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.column}</p>
                        <p className="text-xs text-zinc-500">{item.note}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Workflow className="h-4 w-4" /> 크롤링 대상 사이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {crawlerTargets.map((item) => (
                      <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
