import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const EXTRACTIE_PROMPT = `Je bent een financieel expert die Nederlandse jaarrekeningen analyseert.

Analyseer het bijgevoegde document (jaarrekening/jaarcijfers) en extraheer alle beschikbare financiële gegevens.

Retourneer ALLEEN een geldig JSON-object in het volgende formaat. Gebruik 0 voor velden die niet te vinden zijn. Alle bedragen in hele euros.

{
  "naam": string,
  "boekjaar": string,
  "bedrijfsvorm": "eenmanszaak" | "vof" | "maatschap" | "cv" | "bv" | "nv",
  "balans": {
    "immaterieleVasteActiva": number,
    "materieleVasteActiva": number,
    "financieleVasteActiva": number,
    "voorraden": number,
    "debiteuren": number,
    "overigeVorderingen": number,
    "liquideMiddelen": number,
    "aandelenkapitaal": number,
    "agioreserve": number,
    "wettelijkeReserves": number,
    "overigeReserves": number,
    "winstBoekjaar": number,
    "voorzieningen": number,
    "langlopendeLeningen": number,
    "overigeLanglopendeSchulden": number,
    "crediteuren": number,
    "kortlopendeBank": number,
    "belastingenPremies": number,
    "overigeKortlopendeSchulden": number
  },
  "winstVerlies": {
    "omzet": number,
    "kostprijsOmzet": number,
    "personeelskosten": number,
    "afschrijvingen": number,
    "huisvestingkosten": number,
    "verkoopkosten": number,
    "algemeneBeheerkosten": number,
    "overigeBedrKosten": number,
    "financieleBaten": number,
    "rentelasten": number,
    "zelfstandigenaftrek": number,
    "startersaftrek": number,
    "meewerkaftrek": number,
    "vpbBelasting": number,
    "dgaSalaris": number
  }
}

Extractietips voor Nederlandse jaarrekeningen:
- Vaste activa: materieel (gebouwen/machines), immaterieel (goodwill/licenties), financieel (deelnemingen)
- Vlottende activa: voorraden, handelsdebiteuren/vorderingen, kas en banktegoeden
- Eigen vermogen: gestort kapitaal + reserves + resultaat boekjaar
- Langlopende schulden: schulden met looptijd > 1 jaar (hypotheek, obligaties)
- Kortlopende schulden: handelscrediteuren, RC-bank, belastingschuld, overlopende posten
- Omzet = netto-omzet / bedrijfsopbrengsten / opbrengsten uit leveringen
- Kostprijs = inkoopwaarde van de omzet / kostprijs omzet
- Personeelskosten = salarissen + sociale lasten + pensioenpremies
- Rentelasten = financieringslasten / rente op schulden
- VPB = vennootschapsbelasting / belasting naar de winst
- Zelfstandigenaftrek en MKB-winstvrijstelling = alleen bij IB-ondernemers

Geef UITSLUITEND het JSON-object terug, zonder extra tekst.`;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is niet ingesteld. Voeg deze toe aan de .env.local.' },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Alleen PDF-bestanden worden ondersteund.' },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximum is 20 MB.' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any,
            {
              type: 'text',
              text: EXTRACTIE_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error:
            'Kon geen financiële gegevens uitlezen uit het document. Controleer of het een geldige jaarrekening is.',
        },
        { status: 422 },
      );
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: 'Ongeldig formaat van de geëxtraheerde gegevens.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ data: extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('Extractie fout:', message);
    return NextResponse.json(
      { error: `Fout bij verwerken document: ${message}` },
      { status: 500 },
    );
  }
}
