import type { ProjectRecord, ProjectRecordInput, ProjectRecordType, ProjectsAPI } from '../../contracts';
import { UnauthorizedError } from '../../errors';
import { supabaseClient, isMockSupabaseClient } from '../../supabaseClient';
import { normalizeToArray } from '@/shared/lib/normalizeArray';

const sb = supabaseClient;

// 실제 Supabase 클라이언트인지 확인
if (isMockSupabaseClient) {
  console.warn('[supabase/projects] ⚠️ WARNING: Using mock Supabase client even though API adapter is set to supabase!');
  console.warn('[supabase/projects] This means environment variables might not be loaded correctly.');
} else {
  console.info('[supabase/projects] ✅ Using real Supabase client');
}

export const projects: ProjectsAPI = {
  async list(): Promise<ProjectRecord[]> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError || !user) {
      throw new UnauthorizedError('사용자 인증이 필요합니다.');
    }

    // Supabase에서 프로젝트 목록 조회
    // 테이블 이름은 'projects'로 가정하고, owner_id로 필터링
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[supabase/projects] Error fetching projects:', error);
      throw new Error(`프로젝트를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // ProjectRecord 타입에 맞게 변환
    // Supabase에서 반환된 데이터를 ProjectRecord 형식으로 매핑
    const records: ProjectRecord[] = data.map((row: any) => ({
      id: row.id,
      title: row.title || '',
      category: row.category || '',
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags) : []),
      summary: row.summary || '',
      type: (row.type as ProjectRecordType) || 'project',
      sourceUrl: row.source_url || row.sourceUrl || null,
      period: row.period || null, // period는 로컬에서만 사용 (Supabase에 저장되지 않음)
      startDate: row.start_date || row.startDate || null,
      endDate: row.end_date || row.endDate || null,
      role: row.roles || row.role || null, // roles (복수형) 컬럼에서 읽기
      achievements: row.achievements || null,
      tools: Array.isArray(row.tools) ? row.tools.join(', ') : (row.tools || null), // 배열을 문자열로 변환
      description: row.description || null,
    }));

    console.info(`[supabase/projects] Loaded ${records.length} projects for user ${user.id}`);
    return records;
  },
  async create(data: Partial<ProjectRecordInput>): Promise<ProjectRecord> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError) {
      console.error('[supabase/projects] Auth error:', userError);
      throw new UnauthorizedError(`사용자 인증 오류: ${userError.message}`);
    }

    if (!user) {
      console.error('[supabase/projects] No user found');
      throw new UnauthorizedError('사용자 인증이 필요합니다. 로그인해주세요.');
    }

    console.info(`[supabase/projects] Creating new project for user ${user.id}`);

    // 생성할 데이터 준비
    const insertData: any = {
      owner_id: user.id,
    };
    
    if (data.title !== undefined) insertData.title = data.title;
    if (data.category !== undefined) insertData.category = data.category;
    if (data.tags !== undefined) {
      // tags는 text[] 배열 타입이므로 항상 배열로 정규화
      insertData.tags = normalizeToArray(data.tags);
    }
    if (data.summary !== undefined) insertData.summary = data.summary;
    if (data.startDate !== undefined) {
      if (data.startDate === null) {
        insertData.start_date = null;
      } else if (typeof data.startDate === 'string') {
        insertData.start_date = data.startDate;
      } else {
        insertData.start_date = new Date(data.startDate).toISOString();
      }
    }
    if (data.endDate !== undefined) {
      if (data.endDate === null) {
        insertData.end_date = null;
      } else if (typeof data.endDate === 'string') {
        insertData.end_date = data.endDate;
      } else {
        insertData.end_date = new Date(data.endDate).toISOString();
      }
    }
    if (data.role !== undefined) {
      // roles는 text[] 배열 타입이므로 항상 배열로 정규화
      insertData.roles = normalizeToArray(data.role);
    }
    if (data.achievements !== undefined) {
      // achievements는 text[] 배열 타입이므로 항상 배열로 정규화
      insertData.achievements = normalizeToArray(data.achievements);
    }
    if (data.tools !== undefined) {
      // tools는 text[] 배열 타입이므로 항상 배열로 정규화
      insertData.tools = normalizeToArray(data.tools);
    }
    if (data.description !== undefined) insertData.description = data.description;

    // 디버깅: Supabase에 전송될 payload 확인
    console.log('[supabase/projects] Payload being sent to Supabase:', JSON.stringify(insertData, null, 2));
    console.log('[supabase/projects] Array fields normalized:', {
      tags: insertData.tags,
      roles: insertData.roles,
      tools: insertData.tools,
      achievements: insertData.achievements,
    });

    // Supabase에 프로젝트 생성
    const { data: createdData, error } = await sb
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[supabase/projects] Error creating project:', error);
      throw new Error(`프로젝트를 생성하는 중 오류가 발생했습니다: ${error.message}`);
    }

    if (!createdData) {
      throw new Error('프로젝트 생성에 실패했습니다.');
    }

    // ProjectRecord 형식으로 변환
    const record: ProjectRecord = {
      id: createdData.id,
      title: createdData.title || '',
      category: createdData.category || '',
      tags: Array.isArray(createdData.tags) ? createdData.tags : (createdData.tags ? JSON.parse(createdData.tags) : []),
      summary: createdData.summary || '',
      type: (createdData.type as ProjectRecordType) || 'project',
      sourceUrl: createdData.source_url || createdData.sourceUrl || null,
      period: createdData.period || null,
      startDate: createdData.start_date || createdData.startDate || null,
      endDate: createdData.end_date || createdData.endDate || null,
      role: createdData.roles || createdData.role || null,
      achievements: createdData.achievements || null,
      tools: Array.isArray(createdData.tools) ? createdData.tools.join(', ') : (createdData.tools || null),
      description: createdData.description || null,
    };

    console.info(`[supabase/projects] Created project ${record.id} for user ${user.id}`);
    return record;
  },
  async update(id: number | string, data: Partial<ProjectRecordInput>): Promise<ProjectRecord> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError) {
      console.error('[supabase/projects] Auth error:', userError);
      throw new UnauthorizedError(`사용자 인증 오류: ${userError.message}`);
    }

    if (!user) {
      console.error('[supabase/projects] No user found');
      throw new UnauthorizedError('사용자 인증이 필요합니다. 로그인해주세요.');
    }

    console.info(`[supabase/projects] Updating project ${id} for user ${user.id}`);

    // 업데이트할 데이터 준비 (ProjectRecord 형식을 Supabase 컬럼 형식으로 변환)
    // Supabase는 snake_case만 인식하므로 camelCase는 제거
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) {
      // tags는 text[] 배열 타입이므로 항상 배열로 정규화
      updateData.tags = normalizeToArray(data.tags);
    }
    if (data.summary !== undefined) updateData.summary = data.summary;
    // type 컬럼은 테이블에 존재하지 않으므로 제외
    // if (data.type !== undefined) updateData.type = data.type;
    // source_url도 테이블에 없을 수 있으므로 제외
    // if (data.sourceUrl !== undefined) {
    //   updateData.source_url = data.sourceUrl;
    // }
    // files와 links는 테이블에 있지만 현재 사용되지 않음
    // 필요시 추가 가능:
    // if (data.files !== undefined) updateData.files = data.files;
    // if (data.links !== undefined) updateData.links = Array.isArray(data.links) ? data.links : [];
    // period 컬럼은 Supabase 테이블에 존재하지 않으므로 제외
    // if (data.period !== undefined) updateData.period = data.period;
    if (data.startDate !== undefined) {
      // startDate는 이미 ISO 문자열이거나 Date 객체일 수 있음
      if (data.startDate === null) {
        updateData.start_date = null;
      } else if (typeof data.startDate === 'string') {
        updateData.start_date = data.startDate;
      } else {
        updateData.start_date = new Date(data.startDate).toISOString();
      }
    }
    if (data.endDate !== undefined) {
      // endDate는 이미 ISO 문자열이거나 Date 객체일 수 있음
      if (data.endDate === null) {
        updateData.end_date = null;
      } else if (typeof data.endDate === 'string') {
        updateData.end_date = data.endDate;
      } else {
        updateData.end_date = new Date(data.endDate).toISOString();
      }
    }
    // 테이블 스키마에 맞게 필드명 수정
    // roles는 text[] 배열 타입이므로 항상 배열로 정규화
    if (data.role !== undefined) {
      updateData.roles = normalizeToArray(data.role);
    }
    if (data.achievements !== undefined) {
      // achievements는 text[] 배열 타입이므로 항상 배열로 정규화
      updateData.achievements = normalizeToArray(data.achievements);
    }
    // tools는 text[] 배열 타입이므로 항상 배열로 정규화
    if (data.tools !== undefined) {
      updateData.tools = normalizeToArray(data.tools);
    }
    if (data.description !== undefined) updateData.description = data.description;

    // 디버깅: Supabase에 전송될 payload 확인
    console.log('[supabase/projects] Update payload being sent to Supabase:', JSON.stringify(updateData, null, 2));
    console.log('[supabase/projects] Array fields normalized:', {
      tags: updateData.tags,
      roles: updateData.roles,
      tools: updateData.tools,
      achievements: updateData.achievements,
    });

    // ID를 문자열로 변환 (Supabase 테이블의 id는 UUID 타입)
    const projectId = typeof id === 'string' ? id : id.toString();

    // Supabase에서 프로젝트 업데이트 (표현 반환을 요청하지 않음 – 406 회피)
    const { error: updateError } = await sb
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('owner_id', user.id);

    if (updateError) {
      // 일부 환경에서 RLS/권한 정책으로 인해 representation을 반환할 수 없어 406이 날 수 있음
      // 위에서 representation을 요청하지 않았기 때문에 대부분의 406은 피하지만,
      // 혹시 모를 에러는 메시지로 전달
      console.error('[supabase/projects] Error updating project:', updateError);
      throw new Error(`프로젝트를 저장하는 중 오류가 발생했습니다: ${updateError.message}`);
    }

    // 업데이트 이후 최신 데이터 조회 시도
    const { data: fetched, error: fetchError } = await sb
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (fetchError) {
      // 선택 권한이 제한된 경우 등 – 최소한 성공 로그만 남기고 입력 데이터 기반으로 응답 구성
      console.warn('[supabase/projects] Warning: could not fetch updated row after update:', fetchError);
      const fallback: ProjectRecord = {
        id: typeof id === 'string' ? id : Number(id),
        title: updateData.title ?? '',
        category: updateData.category ?? '',
        tags: Array.isArray(updateData.tags)
          ? updateData.tags
          : updateData.tags
          ? (typeof updateData.tags === 'string'
              ? [updateData.tags]
              : [])
          : [],
        summary: updateData.summary ?? '',
        type: 'project',
        sourceUrl: null,
        period: null,
        startDate: updateData.start_date ?? null,
        endDate: updateData.end_date ?? null,
        role: Array.isArray(updateData.roles) ? updateData.roles.join(', ') : (updateData.roles ?? null),
        achievements: Array.isArray(updateData.achievements) ? updateData.achievements.join(', ') : (updateData.achievements ?? null),
        tools: Array.isArray(updateData.tools) ? updateData.tools.join(', ') : (updateData.tools ?? null),
        description: updateData.description ?? null,
      };
      console.info(`[supabase/projects] Updated project ${id} for user ${user.id} (fallback without fetch)`);
      return fallback;
    }

    if (!fetched) {
      // 선택 권한이 없어서 조회가 되지 않을 수 있음 – 입력 데이터 기반으로 응답 구성
      const fallback: ProjectRecord = {
        id: typeof id === 'string' ? id : Number(id),
        title: updateData.title ?? '',
        category: updateData.category ?? '',
        tags: Array.isArray(updateData.tags)
          ? updateData.tags
          : updateData.tags
          ? (typeof updateData.tags === 'string'
              ? [updateData.tags]
              : [])
          : [],
        summary: updateData.summary ?? '',
        type: 'project',
        sourceUrl: null,
        period: null,
        startDate: updateData.start_date ?? null,
        endDate: updateData.end_date ?? null,
        role: Array.isArray(updateData.roles) ? updateData.roles.join(', ') : (updateData.roles ?? null),
        achievements: Array.isArray(updateData.achievements) ? updateData.achievements.join(', ') : (updateData.achievements ?? null),
        tools: Array.isArray(updateData.tools) ? updateData.tools.join(', ') : (updateData.tools ?? null),
        description: updateData.description ?? null,
      };
      console.info(`[supabase/projects] Updated project ${id} for user ${user.id} (fallback without fetch - no row returned)`);
      return fallback;
    }

    // 조회한 데이터를 사용
    const record: ProjectRecord = {
      id: fetched.id,
      title: fetched.title || '',
      category: fetched.category || '',
      tags: Array.isArray(fetched.tags) ? fetched.tags : (fetched.tags ? JSON.parse(fetched.tags) : []),
      summary: fetched.summary || '',
      type: (fetched.type as ProjectRecordType) || 'project',
      sourceUrl: fetched.source_url || fetched.sourceUrl || null,
      period: fetched.period || null,
      startDate: fetched.start_date || fetched.startDate || null,
      endDate: fetched.end_date || fetched.endDate || null,
      role: fetched.roles || fetched.role || null,
      achievements: fetched.achievements || null,
      tools: Array.isArray(fetched.tools) ? fetched.tools.join(', ') : (fetched.tools || null),
      description: fetched.description || null,
    };

    console.info(`[supabase/projects] Updated project ${id} for user ${user.id}`);
    return record;
  },
  async delete(id: number | string): Promise<void> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();

    if (userError) {
      console.error('[supabase/projects] Auth error:', userError);
      throw new UnauthorizedError(`사용자 인증 오류: ${userError.message}`);
    }

    if (!user) {
      console.error('[supabase/projects] No user found');
      throw new UnauthorizedError('사용자 인증이 필요합니다. 로그인해주세요.');
    }

    console.info(`[supabase/projects] Deleting project ${id} for user ${user.id}`);

    // ID를 문자열로 변환 (Supabase 테이블의 id는 UUID 타입)
    const projectId = typeof id === 'string' ? id : id.toString();

    // Supabase에서 프로젝트 삭제
    // owner_id도 확인하여 본인의 프로젝트만 삭제 가능하도록 함
    const { error } = await sb
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', user.id); // 사용자 소유 확인

    if (error) {
      console.error('[supabase/projects] Error deleting project:', error);
      throw new Error(`프로젝트를 삭제하는 중 오류가 발생했습니다: ${error.message}`);
    }

    console.info(`[supabase/projects] Deleted project ${id} for user ${user.id}`);
  },
};


