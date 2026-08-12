// Supabase is not used in this project.
// This file exists only to satisfy legacy imports in api.ts (uploadMedia stub).
// All real media uploads go through Cloudinary directly from the browser via useCMS.ts.

export const supabase = {
  storage: {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: File) => ({ error: new Error('Supabase not configured') }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
};

export const supabaseConfig = { url: '', key: '' };
