import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a veterinary clinical data extraction assistant. Extract structured medical entities from clinical text about canine patients.

Given a clinical description, extract:
1. **conditions**: Diagnosed conditions or diseases (name, severity if mentioned: mild/moderate/severe, any additional details like laterality)
2. **medications**: Medications being taken (name, dosage if mentioned, type/class)
3. **symptoms**: Clinical symptoms observed (name, duration if mentioned, frequency)
4. **examResults**: Exam or test results (type of exam, findings/results)
5. **biomarkers**: Lab values or biomarkers (name, value, unit)

Context about the patient:
- Species: Canine
- Breed: {{breed}}
- Age: {{age}} years

Return a JSON object with these 5 arrays. If a category has no entities, return an empty array.
Be precise with medical terminology. Prefer standardized condition names when possible.

CLINICAL LANGUAGE LAYER (mandatory):
- The veterinarian writes in TRADITIONAL clinical language (e.g., "OA moderada bilateral", "ALT elevada", "perda de massa muscular", "Carprofen 2 mg/kg BID").
- DO NOT introduce geroscience terminology (senescence, inflammaging, NAD+, autophagy, mitochondrial dysfunction, hallmarks of aging, senolytics, geroprotector) into the extracted entities. Geroscience interpretation is the responsibility of downstream system layers, never attributed to the vet.
- Extract findings exactly as documented; normalize naming only within traditional veterinary nomenclature.

Always respond with valid JSON only, no additional text.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { petId, clinicalText, existingProfile } = await req.json();

    if (!clinicalText || typeof clinicalText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'clinicalText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = SYSTEM_PROMPT
      .replace('{{breed}}', existingProfile?.breed || 'Unknown')
      .replace('{{age}}', String(existingProfile?.age || 'Unknown'));

    // Use Lovable AI (Gemini) via the built-in endpoint
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      // Fallback: use a simple rule-based extraction for demo
      const extracted = simpleExtraction(clinicalText);
      return new Response(
        JSON.stringify(extracted),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nClinical text:\n"${clinicalText}"` }] }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      // Fallback to simple extraction
      const extracted = simpleExtraction(clinicalText);
      return new Response(
        JSON.stringify(extracted),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const extracted = simpleExtraction(clinicalText);
      return new Response(
        JSON.stringify(extracted),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = simpleExtraction(clinicalText);
      }
    }

    return new Response(
      JSON.stringify({
        conditions: parsed.conditions || [],
        medications: parsed.medications || [],
        symptoms: parsed.symptoms || [],
        examResults: parsed.examResults || [],
        biomarkers: parsed.biomarkers || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-pet-clinical-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple rule-based extraction fallback
function simpleExtraction(text: string) {
  const lowerText = text.toLowerCase();
  const conditions: any[] = [];
  const medications: any[] = [];
  const symptoms: any[] = [];
  const examResults: any[] = [];
  const biomarkers: any[] = [];

  // Common conditions
  const conditionPatterns = [
    { pattern: /displasia\s*(coxofemoral|de quadril|hip)/i, name: 'Hip Dysplasia' },
    { pattern: /artrite|arthritis|osteoartrite|osteoarthritis/i, name: 'Osteoarthritis' },
    { pattern: /epilepsia|epilepsy|convuls/i, name: 'Epilepsy' },
    { pattern: /diabetes/i, name: 'Diabetes Mellitus' },
    { pattern: /hipotireoidismo|hypothyroidism/i, name: 'Hypothyroidism' },
    { pattern: /insufici[eê]ncia card[ií]aca|heart failure|cardiac/i, name: 'Heart Disease' },
    { pattern: /doença valv|mitral valve|valve disease/i, name: 'Mitral Valve Disease' },
    { pattern: /dermatite|dermatitis|atopi/i, name: 'Atopic Dermatitis' },
    { pattern: /insufici[eê]ncia pancre[aá]tica|EPI|pancreatic insufficiency/i, name: 'Exocrine Pancreatic Insufficiency' },
    { pattern: /disfunção cognitiva|cognitive dysfunction|CCD/i, name: 'Canine Cognitive Dysfunction' },
    { pattern: /siringomielia|syringomyelia/i, name: 'Syringomyelia' },
    { pattern: /espondilose|spondylosis/i, name: 'Spondylosis' },
  ];

  for (const { pattern, name } of conditionPatterns) {
    if (pattern.test(text)) {
      const severity = /grave|sever/i.test(text) ? 'severe' : /moderado|moderate/i.test(text) ? 'moderate' : /leve|mild/i.test(text) ? 'mild' : undefined;
      conditions.push({ name, severity });
    }
  }

  // Common medications
  const medPatterns = [
    { pattern: /meloxicam/i, name: 'Meloxicam' },
    { pattern: /carprofeno|carprofen/i, name: 'Carprofen' },
    { pattern: /fenobarbital|phenobarbital/i, name: 'Phenobarbital' },
    { pattern: /brometo de pot[aá]ssio|potassium bromide/i, name: 'Potassium Bromide' },
    { pattern: /pimobendan/i, name: 'Pimobendan' },
    { pattern: /furosemida|furosemide/i, name: 'Furosemide' },
    { pattern: /selegilina|selegiline/i, name: 'Selegiline' },
    { pattern: /levotiroxina|levothyroxine/i, name: 'Levothyroxine' },
    { pattern: /gabapentina|gabapentin/i, name: 'Gabapentin' },
    { pattern: /tramadol/i, name: 'Tramadol' },
  ];

  for (const { pattern, name } of medPatterns) {
    if (pattern.test(text)) {
      const dosageMatch = text.match(new RegExp(`${name}[^.]*?(\\d+[.,]?\\d*\\s*mg\\/kg)`, 'i'));
      medications.push({ name, dosage: dosageMatch?.[1] || undefined });
    }
  }

  // Symptoms
  const symptomPatterns = [
    { pattern: /claudica|limping|lameness|mancando/i, name: 'Lameness/Claudication' },
    { pattern: /vomit/i, name: 'Vomiting' },
    { pattern: /diarreia|diarrhea/i, name: 'Diarrhea' },
    { pattern: /coçando|prurido|itching|scratching/i, name: 'Pruritus' },
    { pattern: /tosse|cough/i, name: 'Cough' },
    { pattern: /letargia|letharg/i, name: 'Lethargy' },
    { pattern: /desorient|confusion|confused/i, name: 'Disorientation' },
    { pattern: /perda de peso|weight loss/i, name: 'Weight Loss' },
    { pattern: /apetite reduzido|inapetência|decreased appetite/i, name: 'Decreased Appetite' },
  ];

  for (const { pattern, name } of symptomPatterns) {
    if (pattern.test(text)) {
      const durationMatch = text.match(/h[aá]\s*(\d+)\s*(meses?|semanas?|dias?|months?|weeks?|days?)/i);
      symptoms.push({ name, duration: durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : undefined });
    }
  }

  // Exam types
  const examPatterns = [
    { pattern: /radiografia|x-ray|raio-?x/i, name: 'X-Ray' },
    { pattern: /ecocardiograma|echocardiogram/i, name: 'Echocardiogram' },
    { pattern: /hemograma|blood count|CBC/i, name: 'Complete Blood Count' },
    { pattern: /ultrassom|ultrasound|ultrasonografia/i, name: 'Ultrasound' },
    { pattern: /resson[aâ]ncia|MRI/i, name: 'MRI' },
    { pattern: /urin[aá]lise|urinalysis/i, name: 'Urinalysis' },
  ];

  for (const { pattern, name } of examPatterns) {
    if (pattern.test(text)) {
      examResults.push({ type: name, finding: 'See clinical notes' });
    }
  }

  // Biomarkers
  const bioMarkerMatch = text.match(/leuc[oó]citos?\s*:?\s*(\d+[.,]?\d*)/i);
  if (bioMarkerMatch) {
    biomarkers.push({ name: 'Leukocytes', value: parseFloat(bioMarkerMatch[1].replace(',', '.')), unit: '/µL' });
  }

  return { conditions, medications, symptoms, examResults, biomarkers };
}
