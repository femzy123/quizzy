"use server";

import { createClient } from "@/utils/supabase/server";
import { generateRemark } from "@/lib/ai/generate-remark";

export async function saveAttemptAction({ quizId, score, total, title, difficulty, weakAreas = [] }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const remark = await generateRemark({ score, total, title, difficulty, weakAreas });

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      score,
      total,
      remark,
    })
    .select("id, remark")
    .single();

  if (error) throw new Error(error.message);
  return data; // { id, remark }
}
