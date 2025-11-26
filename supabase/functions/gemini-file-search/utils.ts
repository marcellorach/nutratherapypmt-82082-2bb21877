/**
 * Utility functions for gemini-file-search
 */

/**
 * Get configuration value from ai_configurations table
 */
export async function getConfigValue(
  supabaseClient: any,
  key: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', key)
      .maybeSingle();
    
    if (error) {
      console.warn(`⚠️ Erro ao buscar config ${key}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`ℹ️ Config ${key} não encontrada, usando valor padrão`);
      return null;
    }
    
    // config_value é JSONB, então pode ser string ou objeto
    const value = typeof data.config_value === 'string' 
      ? data.config_value 
      : JSON.stringify(data.config_value);
    
    return value;
  } catch (err) {
    console.error(`❌ Erro ao buscar ${key}:`, err);
    return null;
  }
}
