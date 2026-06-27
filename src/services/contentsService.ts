/**
 * contentsService.ts
 *
 * Camada de acesso a dados para conteúdos estudados.
 * Toda a comunicação com o Supabase relativa a `contents` passa por aqui.
 * Inclui operações de Storage para fotos de cadernos.
 */

import { supabase } from '../lib/supabase';
import type { ContentRecord } from '../types';

// ─── Tipos internos do serviço ────────────────────────────────────────────────

/** Linha da tabela `contents` tal como vem do Supabase (snake_case) */
interface ContentRow {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description: string;
  observations: string | null;
  is_photo_upload: boolean;
  photo_url: string | null;
  study_date: string;
  created_at: string;
  // JOIN com subjects para obter o nome
  subjects: { name: string } | null;
}

/** Payload para criar um conteúdo (sem id, user_id, timestamps) */
export interface CreateContentPayload {
  subjectId: string;
  title: string;
  description: string;
  observations?: string;
  studyDate: string;
  isPhotoUpload?: boolean;
  photoPath?: string; // path no Storage após upload
}

/** Payload para editar um conteúdo */
export interface UpdateContentPayload {
  subjectId?: string;
  title?: string;
  description?: string;
  observations?: string;
  studyDate?: string;
  photoPath?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converte uma linha do DB (snake_case + JOIN) para ContentRecord (UI / camelCase).
 * O subjectName vem do JOIN com subjects — elimina a desnormalização do mock.
 */
function rowToContentRecord(row: ContentRow): ContentRecord {
  return {
    id:            row.id,
    subjectId:     row.subject_id,
    subjectName:   row.subjects?.name ?? 'Sem disciplina',
    date:          row.study_date,
    title:         row.title,
    description:   row.description,
    observations:  row.observations ?? undefined,
    isPhotoUpload: row.is_photo_upload,
    photoUrl:      row.photo_url ?? undefined,
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const BUCKET = 'content-photos';

/**
 * Faz upload de uma foto de caderno para o Supabase Storage.
 * Organiza ficheiros por userId para respeitar as políticas RLS do bucket.
 * Retorna o path do ficheiro (ex: "uuid/1719400000000.jpg").
 */
export async function uploadContentPhoto(
  userId: string,
  file: File
): Promise<string> {
  const ext       = file.name.split('.').pop() ?? 'jpg';
  const filename  = `${Date.now()}.${ext}`;
  const filePath  = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Falha no upload da imagem: ${error.message}`);

  return filePath;
}

/**
 * Gera uma URL assinada temporária (1 hora) para visualizar uma foto privada.
 * O bucket é privado — não existem URLs públicas permanentes.
 */
export async function getPhotoSignedUrl(photoPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(photoPath, 3600); // expira em 1 hora

  if (error || !data?.signedUrl) {
    throw new Error('Não foi possível gerar o URL da imagem.');
  }

  return data.signedUrl;
}

/**
 * Apaga uma foto do Storage quando o conteúdo é eliminado.
 * Silencioso em caso de falha (o conteúdo é apagado mesmo que a foto não seja).
 */
export async function deleteContentPhoto(photoPath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([photoPath]);
}

// ─── CRUD de Conteúdos ────────────────────────────────────────────────────────

/**
 * Carrega todos os conteúdos do utilizador autenticado.
 * Faz JOIN com subjects para obter o nome da disciplina.
 * Ordena do mais recente para o mais antigo.
 */
export async function fetchContents(): Promise<ContentRecord[]> {
  const { data, error } = await supabase
    .from('contents')
    .select(`
      id,
      user_id,
      subject_id,
      title,
      description,
      observations,
      is_photo_upload,
      photo_url,
      study_date,
      created_at,
      subjects ( name )
    `)
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as ContentRow[]).map(rowToContentRecord);
}

/**
 * Cria um novo conteúdo associado ao utilizador autenticado.
 * O user_id é obtido da sessão e passado explicitamente (obrigatório para RLS).
 */
export async function createContent(
  payload: CreateContentPayload
): Promise<ContentRecord> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  const { data, error } = await supabase
    .from('contents')
    .insert({
      user_id:         user.id,
      subject_id:      payload.subjectId,
      title:           payload.title.trim(),
      description:     payload.description.trim(),
      observations:    payload.observations?.trim() || null,
      study_date:      payload.studyDate,
      is_photo_upload: payload.isPhotoUpload ?? false,
      photo_url:       payload.photoPath ?? null,
    })
    .select(`
      id, user_id, subject_id, title, description,
      observations, is_photo_upload, photo_url, study_date, created_at,
      subjects ( name )
    `)
    .single();

  if (error) throw new Error(error.message);

  return rowToContentRecord(data as ContentRow);
}

/**
 * Actualiza um conteúdo existente.
 */
export async function updateContent(
  id: string,
  payload: UpdateContentPayload
): Promise<ContentRecord> {
  const updateData: Record<string, unknown> = {};
  if (payload.subjectId   !== undefined) updateData.subject_id    = payload.subjectId;
  if (payload.title       !== undefined) updateData.title         = payload.title.trim();
  if (payload.description !== undefined) updateData.description   = payload.description.trim();
  if (payload.observations !== undefined) updateData.observations = payload.observations.trim() || null;
  if (payload.studyDate   !== undefined) updateData.study_date    = payload.studyDate;
  if (payload.photoPath   !== undefined) updateData.photo_url     = payload.photoPath;

  const { data, error } = await supabase
    .from('contents')
    .update(updateData)
    .eq('id', id)
    .select(`
      id, user_id, subject_id, title, description,
      observations, is_photo_upload, photo_url, study_date, created_at,
      subjects ( name )
    `)
    .single();

  if (error) throw new Error(error.message);

  return rowToContentRecord(data as ContentRow);
}

/**
 * Apaga um conteúdo e a foto associada (se existir).
 */
export async function deleteContent(
  id: string,
  photoPath?: string
): Promise<void> {
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Apagar foto do Storage em paralelo (sem bloquear se falhar)
  if (photoPath) {
    deleteContentPhoto(photoPath).catch(console.warn);
  }
}
