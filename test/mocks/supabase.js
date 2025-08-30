/**
 * Supabase Mock Factory
 * Following GL-TESTING-GUIDELINES.md
 */

/**
 * Create a successful Supabase mock
 * @param {any} data - Data to return
 * @returns {Object} Mocked Supabase client
 */
export const SupabaseMockFactory = {
  createSuccessMock: (data = null) => ({
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
          data: data || [], 
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
        eq: jest.fn(() => Promise.resolve({ data, error: null })),
        single: jest.fn(() => Promise.resolve({ data: data?.[0] || null, error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data, error: null })),
      update: jest.fn(() => Promise.resolve({ data, error: null })),
      delete: jest.fn(() => Promise.resolve({ data, error: null }))
    }))
  }),

  createErrorMock: (errorMessage = 'Mock error') => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error(errorMessage) 
        })),
        download: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error(errorMessage) 
        })),
        remove: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error(errorMessage) 
        })),
        list: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error(errorMessage) 
        })),
        getPublicUrl: jest.fn(() => ({ 
          data: null, 
          error: new Error(errorMessage) 
        }))
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: new Error(errorMessage) }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: new Error(errorMessage) })),
      update: jest.fn(() => Promise.resolve({ data: null, error: new Error(errorMessage) })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: new Error(errorMessage) }))
    }))
  }),

  createComplexQueryMock: ({ table, chains, data }) => {
    const mockChain = {};
    let current = mockChain;
    
    chains.forEach((method, index) => {
      if (index === chains.length - 1) {
        current[method.replace('.', '')] = jest.fn(() => 
          Promise.resolve({ data, error: null })
        );
      } else {
        current[method.replace('.', '')] = jest.fn(() => {
          const next = {};
          current = next;
          return next;
        });
      }
    });

    return {
      from: jest.fn(() => mockChain)
    };
  }
};

// Mock the Supabase createClient function
export const createClient = jest.fn((url, key) => {
  // Return a default successful mock unless overridden
  return SupabaseMockFactory.createSuccessMock();
});