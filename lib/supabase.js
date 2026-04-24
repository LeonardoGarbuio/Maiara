import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin = null;

export const getSupabaseAdmin = () => {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("supabaseUrl and supabaseServiceKey are required");
    }
    return null;
  }

  _supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _supabaseAdmin;
};

// Função utilitária para garantir que o bucket existe
export async function ensureBucketExists(bucketName = "project-files") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    // Tenta obter o bucket diretamente
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
    
    if (bucket) {
      // Bucket já existe
      return;
    }

    // Se não existe, cria
    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });

    if (createError) {
      // Se o erro é "already exists", ignora (pode ter sido criado por outra request)
      if (createError.message?.includes("already exists")) {
        return;
      }
      console.error("Erro ao criar bucket:", createError);
      throw createError;
    }
    
    console.log(`Bucket ${bucketName} criado com sucesso.`);
  } catch (error) {
    console.error("Erro ao verificar/criar bucket:", error);
  }
}

// Manter compatibilidade se necessário, mas desencorajar uso direto no top-level
export const supabaseAdmin = null; // Agora forçamos o uso do getSupabaseAdmin()
