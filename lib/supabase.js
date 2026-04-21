import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Faltam variáveis de ambiente do Supabase (URL ou SERVICE_ROLE_KEY). Uploads podem falhar.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Função utilitária para garantir que o bucket existe
export async function ensureBucketExists(bucketName = "project-files") {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.find((b) => b.name === bucketName);

    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true, // Arquivos públicos para facilitar o download via URL
        allowedMimeTypes: null, 
        fileSizeLimit: 104857600, // 100 MB via API
      });
      console.log(`Bucket ${bucketName} criado com sucesso.`);
    }
  } catch (error) {
    console.error("Erro ao verificar/criar bucket:", error);
  }
}
