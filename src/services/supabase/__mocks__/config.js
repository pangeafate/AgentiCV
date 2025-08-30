// Mock config for tests
export const supabase = {
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
};

export const STORAGE_CONFIG = {
  bucket: 'cv-uploads',
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

export const isSupabaseConfigured = () => true;
export const isMockMode = false;