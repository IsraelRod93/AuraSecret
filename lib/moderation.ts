import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

// Labels que bloqueamos: desnudez explícita y actividad sexual
const BLOCKED_LABELS = new Set([
  'Explicit Nudity',
  'Nudity',
  'Graphic Male Nudity',
  'Graphic Female Nudity',
  'Sexual Activity',
  'Illustrated Explicit Nudity',
]);

let _client: RekognitionClient | null = null;

function getClient() {
  if (!_client) {
    _client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export async function checkImageContent(
  imageBytes: Buffer
): Promise<{ allowed: boolean; reason?: string }> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    // Moderación no configurada — permitir todo (aviso en logs)
    console.warn('[moderation] AWS_ACCESS_KEY_ID not set — skipping content check');
    return { allowed: true };
  }

  try {
    const cmd = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 80,
    });

    const result = await getClient().send(cmd);
    const labels = result.ModerationLabels || [];

    const blocked = labels.find(l => BLOCKED_LABELS.has(l.Name || ''));

    if (blocked) {
      return {
        allowed: false,
        reason: `Contenido explícito detectado (${blocked.Name}, ${Math.round(blocked.Confidence || 0)}% confianza). Solo se permite contenido sugerente.`,
      };
    }

    return { allowed: true };
  } catch (err) {
    // Si Rekognition falla, no bloqueamos el upload (fail-open)
    console.error('[moderation] Rekognition error:', err);
    return { allowed: true };
  }
}
