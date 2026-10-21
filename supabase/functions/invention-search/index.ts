import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return new Response(
                JSON.stringify({ error: "Keyword is required" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                }
            );
        }

        console.log(`Searching for keyword: ${keyword}`);

        // 1. 발명품 검색 (전문 검색 FTS 활용 검토 및 ilike 최적화)
        // 지노 수석: limit(10)은 유지하되 검색 품질을 높입니다.
        const { data: inventions, error: searchError } = await supabase
            .from("inventions")
            .select("id, simple_title, simple_summary, drawing_url, grade_id")
            .or(`simple_title.ilike.%${keyword}%,simple_summary.ilike.%${keyword}%`)
            .limit(10);

        if (searchError) throw searchError;

        // 2. 전체 데이터 기반 통계 산출 (GROUP BY 활용)
        // 지노 수석: 상위 10개가 아니라 검색된 전체 데이터의 분포를 가져옵니다.
        const { data: statsData, error: statsError } = await supabase
            .rpc('get_invention_stats', { search_keyword: keyword });

        if (statsError) {
            console.error("Stats RPC error:", statsError);
            // RPC가 없을 경우를 대비한 가이드: 아키텍처상 SQL RPC 생성이 권장됨
        }

        return new Response(
            JSON.stringify({
                items: inventions,
                stats: statsData || { grades: {}, categories: {} },
                timestamp: new Date().toISOString()
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Unknown error" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
