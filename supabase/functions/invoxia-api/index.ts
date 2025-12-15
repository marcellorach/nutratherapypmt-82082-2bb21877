import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INVOXIA_BASE_URL = 'https://petradar.invoxia.ai/admin';

interface InvoxiaLoginResponse {
  token: string;
}

async function loginToInvoxia(): Promise<string> {
  const username = Deno.env.get('INVOXIA_USERNAME');
  const password = Deno.env.get('INVOXIA_PASSWORD');

  if (!username || !password) {
    throw new Error('Invoxia credentials not configured');
  }

  console.log('Attempting login to Invoxia API...');

  const response = await fetch(`${INVOXIA_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login: username, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Login failed:', response.status, errorText);
    throw new Error(`Login failed: ${response.status} - ${errorText}`);
  }

  const data: InvoxiaLoginResponse = await response.json();
  console.log('Login successful, token obtained');
  return data.token;
}

async function fetchPetData(token: string, petId: number): Promise<string> {
  console.log(`Fetching data for pet ID: ${petId}`);

  const response = await fetch(
    `${INVOXIA_BASE_URL}/api/v1/pets/${petId}/data?format=csv`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/csv',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fetch pet data failed:', response.status, errorText);
    throw new Error(`Fetch pet data failed: ${response.status} - ${errorText}`);
  }

  const csvData = await response.text();
  console.log(`Received CSV data: ${csvData.length} characters`);
  return csvData;
}

function parseCSV(csvData: string): Record<string, string | number | null>[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    console.log('No data rows in CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  console.log(`CSV headers: ${headers.length} columns`);

  const rows: Record<string, string | number | null>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string | number | null> = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      // Try to parse as number, otherwise keep as string
      if (value === '' || value === 'NA' || value === 'null') {
        row[header] = null;
      } else {
        const numValue = parseFloat(value);
        row[header] = isNaN(numValue) ? value : numValue;
      }
    });

    rows.push(row);
  }

  console.log(`Parsed ${rows.length} data rows`);
  return rows;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { petId } = await req.json();

    if (!petId) {
      return new Response(
        JSON.stringify({ error: 'petId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for pet ID: ${petId}`);

    // Step 1: Login to get token
    const token = await loginToInvoxia();

    // Step 2: Fetch pet data in CSV format
    const csvData = await fetchPetData(token, petId);

    // Step 3: Parse CSV to JSON
    const parsedData = parseCSV(csvData);

    return new Response(
      JSON.stringify({
        success: true,
        petId,
        rowCount: parsedData.length,
        data: parsedData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in invoxia-api function:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
