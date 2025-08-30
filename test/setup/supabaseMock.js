// Mock Supabase client before any tests run
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ 
          data: { path: 'mock/path/file.pdf' }, 
          error: null 
        })),
        download: jest.fn(() => Promise.resolve({ 
          data: new Blob(['mock content']), 
          error: null 
        })),
        remove: jest.fn(() => Promise.resolve({ 
          data: ['mock/path/file.pdf'], 
          error: null 
        })),
        list: jest.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        })),
        getPublicUrl: jest.fn(() => ({ 
          data: { 
            publicUrl: 'https://mock-storage.supabase.co/storage/v1/object/public/cv-uploads/file.pdf' 
          } 
        }))
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}));