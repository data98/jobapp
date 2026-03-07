'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { Organization, OrgMemberRole, UserRole } from '@/types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

export async function completeEmployerSignup(input: {
  companyName: string;
  website?: string;
  companySize: string;
}): Promise<{ organizationId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const supabase = createServerClient();

  // 1. Set user role to employer
  const { error: roleError } = await supabase
    .from('user')
    .update({ role: 'employer' })
    .eq('id', session.user.id);

  if (roleError) throw new Error(roleError.message);

  // 2. Generate unique slug
  let slug = generateSlug(input.companyName);
  const { data: existing } = await supabase
    .from('organization')
    .select('slug')
    .eq('slug', slug)
    .single();
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // 3. Create organization
  const { data: org, error: orgErr } = await supabase
    .from('organization')
    .insert({
      name: input.companyName,
      slug,
      website: input.website || null,
      company_size: input.companySize,
    })
    .select()
    .single();

  if (orgErr || !org) throw new Error(orgErr?.message || 'Failed to create organization');

  // 4. Link user as owner
  const { error: memberErr } = await supabase
    .from('organization_member')
    .insert({
      organization_id: org.id,
      user_id: session.user.id,
      role: 'owner',
    });

  if (memberErr) throw new Error(memberErr.message);

  return { organizationId: org.id };
}

export async function getUserRole(): Promise<UserRole> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const supabase = createServerClient();
  const { data } = await supabase
    .from('user')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return (data?.role as UserRole) || 'seeker';
}

export async function getUserOrganization(): Promise<{
  organization: Organization;
  memberRole: OrgMemberRole;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const supabase = createServerClient();
  const { data: membership } = await supabase
    .from('organization_member')
    .select('organization_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (!membership) return null;

  const { data: org } = await supabase
    .from('organization')
    .select('*')
    .eq('id', membership.organization_id)
    .single();

  if (!org) return null;

  return {
    organization: org as Organization,
    memberRole: membership.role as OrgMemberRole,
  };
}
